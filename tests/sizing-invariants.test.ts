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
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';

import { compute, GB, buildLaunchFlags, type Meta, type Analysis, type SizedMode } from '../src/sizing/size-model.ts';
import {
  configureQuickstart,
  estimateContextFromCatalog,
  gpuPlacementLaunchFlags,
  formatGpuProbe,
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

function multiProbe(vramGbEach: number, count = 2): GpuProbe {
  return {
    gpu_type: 'nvidia',
    driver: 'cuda',
    vram_total_gb: vramGbEach * count,
    vram_free_gb: vramGbEach * count,
    devices: Array.from({ length: count }, (_, i) => ({
      index: i,
      device: `CUDA${i}`,
      name: `RTX ${i}`,
      vram_gb: vramGbEach,
    })),
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
  assert.ok(f.includes('--fit off'));
  assert.ok(f.includes('-b 4096'));
  assert.ok(f.includes('-ub 4096'));
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

test('q4 fallback: q4_0 KV, no -ngl 999 for hybrid without a layer plan', () => {
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

test('moe hybrid keeps non-expert layers on GPU while offloading experts', () => {
  const moe = mockMode({
    strategy: 'hybrid',
    ctx: 131072,
    kvCacheQuant: 'q4_0',
    cpuMoeLayers: 18,
    gpuLayers: 999,
  });
  const { launchFlags, expertFlag } = buildLaunchFlags(moe);
  const f = launchFlags.join(' ');
  assert.ok(f.includes('-ngl 999'));
  assert.ok(f.includes('-b 4096'));
  assert.ok(f.includes('-ub 4096'));
  assert.equal(expertFlag, '--n-cpu-moe 18');
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

test('configureQuickstart: thinking models advertise thinking and launch reasoning parser', () => {
  mk();
  try {
    const dummy = resolve(TMP, 'think.gguf');
    writeFileSync(dummy, 'GGUF_MAGIC_DUMMY');

    const env = parseEnv('');
    const sel = [mkEntry({ id: 'think-m', thinking: 'on' })];
    const paths = new Map<string, string>();
    paths.set('think-m', dummy);

    configureQuickstart(env, sel, paths, '/tmp/llama-server', TMP, probe(16));

    const mm = JSON.parse(env.get('RELAY_MODEL_MAP')!);
    assert.deepEqual(mm['think-m'].thinking_levels, ['on']);
    const script = readFileSync(mm['think-m'].cmd, 'utf8');
    assert.ok(script.includes('--reasoning-format deepseek'));
    assert.ok(script.includes('--reasoning on'));
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

function syntheticMeta(overrides: Partial<Meta> = {}): Meta {
  return {
    arch: 'qwen35',
    nl: 64,
    nkv: 8,
    kl: 128,
    emb: 5120,
    nexp: 0,
    nact: 0,
    trainCtx: 262144,
    swaWindow: undefined,
    swaPattern: undefined,
    fsize: 12 * GB,
    tensors: [],
    ...overrides,
  };
}

function syntheticAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  const nonex = 11.17 * GB;
  return {
    nonex,
    exp: 0,
    kvPtok: 131072,
    nKv: 64,
    nCache: 64,
    fsize: nonex,
    ...overrides,
  };
}

test('catalog estimate uses multi-GPU placement budget for fit labels', () => {
  const m = mkEntry({
    moe: false,
    family: 'dense',
    arch: 'qwen35',
    size_gb: 40,
    ctx: 131072,
    kv_ptok: 131072,
  });
  const single = estimateContextFromCatalog(m, probe(24), 64, 'headless', 'cuda');
  const multi = estimateContextFromCatalog(m, multiProbe(24, 2), 64, 'headless', 'cuda');
  assert.notEqual(single.fit, 'full-gpu');
  assert.equal(multi.fit, 'full-gpu');
});

test('setup launch flags include portable multi-GPU placement', () => {
  const flags = gpuPlacementLaunchFlags(multiProbe(24, 2)).join(' ');
  assert.ok(flags.includes('--device CUDA0,CUDA1'));
  assert.ok(flags.includes('--split-mode layer'));
  assert.ok(flags.includes('--tensor-split 24,24'));
});

test('formatGpuProbe shows multi-GPU total and Relay split budget', () => {
  const text = formatGpuProbe(multiProbe(24, 2));
  assert.match(text, /2 GPUs/);
  assert.match(text, /48GB total VRAM/);
  assert.match(text, /46GB Relay split budget/);
});

test('dense balanced sizing offloads a few layers to reach useful context', () => {
  const result = compute(15.9 * GB, 28 * GB, syntheticMeta(), syntheticAnalysis());
  assert.equal(result.ok, true, result.error);
  const balanced = result.modes.balanced;
  assert.ok(balanced, 'balanced mode must fit');
  assert.equal(balanced.strategy, 'hybrid');
  assert.equal(balanced.kvCacheQuant, 'q4_0');
  assert.ok(balanced.ctx >= 65536, `ctx ${balanced.ctx} should reach the dense balanced target`);
  assert.ok(typeof balanced.gpuLayers === 'number' && balanced.gpuLayers > 0 && balanced.gpuLayers < 64,
    `gpuLayers ${balanced.gpuLayers} should be a real partial-offload layer count`);
});

test('dense capacity sizing is partial-ngl, never fake moe-cpu', () => {
  const result = compute(15.9 * GB, 28 * GB, syntheticMeta(), syntheticAnalysis());
  assert.equal(result.ok, true, result.error);
  const capacity = result.modes.capacity;
  assert.ok(capacity, 'capacity mode must fit');
  assert.notEqual(capacity.strategy, 'moe-cpu');
  assert.equal(capacity.allExpertsCpu, false);
  assert.ok(typeof capacity.gpuLayers === 'number', 'dense capacity must emit a real -ngl value');
});

test('moe sizing keeps double-digit VRAM headroom by default', () => {
  const result = compute(
    15.9 * GB,
    28 * GB,
    syntheticMeta({ arch: 'cohere2moe', nl: 49, nexp: 128, nact: 8, trainCtx: 500000 }),
    syntheticAnalysis({ nonex: 0.65 * GB, exp: 12.71 * GB, kvPtok: 50176, nKv: 49, nCache: 49 }),
  );
  assert.equal(result.ok, true, result.error);
  assert.ok(result.modes.balanced, 'balanced mode must fit');
  assert.ok(result.modes.balanced!.headroomPct >= 12,
    `MoE headroom ${result.modes.balanced!.headroomPct.toFixed(2)}% should be at least 12%`);
});
