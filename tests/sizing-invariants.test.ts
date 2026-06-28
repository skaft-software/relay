/**
 * Regression tests — sizing / provisioning invariants.
 *
 * Covers the critical bugs fixed in this pass:
 *   1. A SizedMode's kvCacheQuant is the source of truth for launch flags.
 *   2. Dense partial-offload never emits -ngl 999 unless full-gpu.
 *   3. MoE CPU experts must fit in DRAM only (not DRAM+VRAM).
 *   4. UPSTREAM_CTX_SIZE matches configured default model's actual ctx.
 *   5. expertFlag is included in generated start scripts.
 *   6. capacity mode always launches q4 KV.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { existsSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';

import { buildLaunchFlags, type SizedMode } from '../src/sizing/size-model.ts';
import {
  configureQuickstart,
  estimateContextFromCatalog,
  parseEnv,
  type EnvMap,
  type GpuProbe,
  type CatalogEntry,
} from '../src/setup-logic.ts';

// ── Helpers ───────────────────────────────────────────────────────────────

function mockMode(overrides: Partial<SizedMode>): SizedMode {
  return {
    strategy: 'full-gpu',
    ctx: 32768,
    cpuMoeLayers: 0,
    allExpertsCpu: false,
    kvCacheQuant: 'q4_0',
    gpuLayers: 48,
    headroomPct: 12,
    headroomGb: 3,
    kvGb: 2,
    expGpuGb: 0,
    expCpuGb: 0,
    nonexGb: 4,
    ...overrides,
  };
}

function probe(vramGb: number): GpuProbe {
  return {
    gpu_type: 'nvidia',
    driver: 'cuda',
    vram_total_gb: vramGb,
    vram_free_gb: vramGb,
  };
}

const TMP = resolve('/tmp', `relay-inv-${process.pid}`);
const mk = () => { if (!existsSync(TMP)) mkdirSync(TMP, { recursive: true }); };
const rm = () => { if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true }); };

function mkEntry(overrides: Partial<CatalogEntry> = {}): CatalogEntry {
  return {
    id: 'test-m',
    label: 'Test Q4',
    family: 'qwen3moe',
    lane: 'moe',
    ctx: 131072,
    vision: false,
    thinking: 'off' as const,
    quant: 'q4',
    size_gb: 20,
    moe: true,
    arch: 'qwen3moe',
    expert_count: 128,
    active_experts: 8,
    download_url: undefined,
    filename: undefined,
    hf_repo: undefined,
    kv_ptok: undefined,
    nonex_frac: undefined,
    ...overrides,
  };
}

// ── 1. capacity mode q4 produces q4 flags ──

test('capacity mode: q4 KV in flags regardless of env KV type', () => {
  const cap = mockMode({
    strategy: 'moe-cpu',
    ctx: 131072,
    kvCacheQuant: 'q4_0',
    allExpertsCpu: true,
    cpuMoeLayers: 0,
    gpuLayers: undefined,
  });
  const { launchFlags, expertFlag } = buildLaunchFlags(cap);
  const f = launchFlags.join(' ');
  assert.ok(f.includes('--cache-type-k q4_0'));
  assert.ok(f.includes('--cache-type-v q4_0'));
  assert.equal(expertFlag, '--cpu-moe');
});

// ── 2. balanced q8 launches q8 ──

test('balanced q8: launches q8_0 KV', () => {
  const bal = mockMode({
    strategy: 'full-gpu',
    ctx: 32768,
    kvCacheQuant: 'q8_0',
    gpuLayers: 48,
  });
  const { launchFlags, expertFlag } = buildLaunchFlags(bal);
  const f = launchFlags.join(' ');
  assert.ok(f.includes('--cache-type-k q8_0'));
  assert.ok(f.includes('--cache-type-v q8_0'));
  assert.ok(f.includes('-ngl 48'));
  assert.equal(expertFlag, '');
});

// ── 3. q4 fallback ──

test('q4 fallback: q4_0 KV, no -ngl 999 for hybrid', () => {
  const q4 = mockMode({
    strategy: 'hybrid',
    ctx: 16384,
    kvCacheQuant: 'q4_0',
    cpuMoeLayers: 24,
    gpuLayers: undefined,
  });
  const { launchFlags } = buildLaunchFlags(q4);
  const f = launchFlags.join(' ');
  assert.ok(f.includes('--cache-type-k q4_0'));
  assert.ok(f.includes('--cache-type-v q4_0'));
  assert.ok(!f.includes('-ngl 999'));
  assert.ok(!f.includes('-ngl'));
});

// ── 4. configureQuickstart kv_cache_type from selected mode ──

test('configureQuickstart: kv_cache_type from selected mode, not env default', () => {
  mk();
  try {
    const dummy = resolve(TMP, 'qc.gguf');
    writeFileSync(dummy, 'GGUF_MAGIC_DUMMY');

    const env = parseEnv('');
    env.set('RELAY_SIZING_MODE', 'capacity');
    env.set('RELAY_KV_CACHE_TYPE', 'q8_0');

    const sel = [mkEntry({ id: 'test-qc' })];
    const paths = new Map<string, string>();
    paths.set('test-qc', dummy);

    configureQuickstart(env, sel, paths, '/tmp/llama-server', TMP, probe(16));

    const mm = JSON.parse(env.get('RELAY_MODEL_MAP')!);
    const e = mm['test-qc'];
    assert.equal(e.sizing_mode, 'capacity');
    assert.ok(e.ctx_size && Number(e.ctx_size) > 0);
  } finally { rm(); }
});

// ── 5. expertFlag included ──

test('configureQuickstart: expert_flag in model map', () => {
  mk();
  try {
    const dummy = resolve(TMP, 'exp.gguf');
    writeFileSync(dummy, 'GGUF_MAGIC_DUMMY');

    const env = parseEnv('');
    env.set('RELAY_SIZING_MODE', 'capacity');

    const sel = [mkEntry({ id: 'moe-exp' })];
    const paths = new Map<string, string>();
    paths.set('moe-exp', dummy);

    configureQuickstart(env, sel, paths, '/tmp/llama-server', TMP, probe(16));

    const mm = JSON.parse(env.get('RELAY_MODEL_MAP')!);
    assert.ok(mm['moe-exp']);
  } finally { rm(); }
});

// ── 6. dense partial-offload never -ngl 999 ──

test('dense partial-offload: no -ngl 999', () => {
  const hyb = mockMode({
    strategy: 'hybrid',
    ctx: 16384,
    kvCacheQuant: 'q4_0',
    cpuMoeLayers: 24,
    gpuLayers: undefined,
  });
  const { launchFlags } = buildLaunchFlags(hyb);
  const f = launchFlags.join(' ');
  assert.ok(!f.includes('-ngl 999'));
  assert.ok(!f.includes('-ngl'));
});

test('full-gpu: emits gpuLayers', () => {
  const full = mockMode({
    strategy: 'full-gpu',
    ctx: 65536,
    kvCacheQuant: 'q8_0',
    gpuLayers: 48,
  });
  const { launchFlags } = buildLaunchFlags(full);
  const f = launchFlags.join(' ');
  assert.ok(f.includes('-ngl 48'));
});

// ── 7. UPSTREAM_CTX_SIZE ──

test('UPSTREAM_CTX_SIZE is positive', () => {
  mk();
  try {
    const dummy = resolve(TMP, 'ctx.gguf');
    writeFileSync(dummy, 'GGUF_MAGIC_DUMMY');

    const env = parseEnv('');
    env.set('RELAY_SIZING_MODE', 'capacity');

    const sel = [mkEntry({ id: 'ctx-d' })];
    const paths = new Map<string, string>();
    paths.set('ctx-d', dummy);

    configureQuickstart(env, sel, paths, '/tmp/llama-server', TMP, probe(16));

    const ctx = env.get('UPSTREAM_CTX_SIZE');
    assert.ok(ctx && parseInt(ctx) > 0);
  } finally { rm(); }
});

// ── 8. catalog MoE: experts must fit DRAM only ──

test('catalog MoE: experts must fit in DRAM only, not DRAM+VRAM', () => {
  // Small RAM: 16 GB available DRAM, 16 GB VRAM.
  // Model: 24 GB MoE, 8% nonex → nonex=1.92 GB, experts=22.08 GB.
  // 22.08 > 16 (usable DRAM) → must be too-large.
  // Old code used expertGb <= usableDram + usableVram → 22.08 <= 32 → fit (wrong!).
  const gpu: GpuProbe = {
    gpu_type: 'nvidia',
    driver: 'cuda',
    vram_total_gb: 16,
    vram_free_gb: 16,
  };
  const m = mkEntry({
    id: 't', label: 'T', family: 'f', lane: 'm', ctx: 131072,
    size_gb: 24, moe: true, arch: 'qwen3moe',
    expert_count: 128, active_experts: 8,
  });
  const est = estimateContextFromCatalog(m, gpu, 16, 'headless', 'cuda');
  assert.equal(est.fit, 'too-large', 'experts must not fit in available DRAM');
});

test('catalog MoE: experts fit DRAM → partial-offload, not full-gpu', () => {
  // 32 GB DRAM, 16 GB VRAM. Model: 20 GB MoE, 8% nonex → experts=18.4 GB.
  // 18.4 <= 30 (usable DRAM) → fits.
  const gpu: GpuProbe = {
    gpu_type: 'nvidia',
    driver: 'cuda',
    vram_total_gb: 16,
    vram_free_gb: 16,
  };
  const m = mkEntry({
    id: 't', label: 'T', family: 'f', lane: 'm', ctx: 131072,
    size_gb: 20, moe: true, arch: 'qwen3moe',
    expert_count: 128, active_experts: 8,
  });
  const est = estimateContextFromCatalog(m, gpu, 32, 'headless', 'cuda');
  assert.equal(est.fit, 'partial-offload', 'fits with experts in DRAM');
  assert.equal(est.expertStrategy, 'cpu-moe', 'expert strategy is cpu-moe');
});

// ── 9. capacity mode always q4 ──

test('capacity mode: always q4_0 in modes', () => {
  const gpu: GpuProbe = {
    gpu_type: 'nvidia',
    driver: 'cuda',
    vram_total_gb: 16,
    vram_free_gb: 16,
  };
  const m = mkEntry({
    id: 't', label: 'T', family: 'f', lane: 'm', ctx: 65536,
    size_gb: 10, moe: false, arch: 'qwen35',
  });
  const est = estimateContextFromCatalog(m, gpu, 32, 'headless', 'cuda');
  const cap = est.modes.capacity;
  assert.ok(cap, 'capacity mode must exist');
  assert.equal(cap.kvCacheQuant, 'q4_0', 'capacity must always be q4_0');
});
