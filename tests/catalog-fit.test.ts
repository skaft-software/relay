/**
 * Catalog fit math: provenance-tagged labels, RAM-headroom guard, host profiles.
 * Host-independent — every case passes an explicit GPU, DRAM budget and profile.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  estimateContextFromCatalog,
  buildFitLabel,
  quantTier,
  reservesFor,
  detectHostProfile,
  type CatalogEntry,
  type CatalogFitEstimate,
  type GpuProbe,
} from '../src/setup-logic.ts';

const GPU16: GpuProbe = { gpu_type: 'amd', driver: 'vulkan', vram_total_gb: 16, vram_free_gb: 16 };

function entry(over: Partial<CatalogEntry>): CatalogEntry {
  return {
    id: 't', label: 'T', family: 'f', lane: 'code', ctx: 131072,
    vision: false, thinking: 'off', quant: 'q4', size_gb: 10, ...over,
  };
}

test('MoE model reaches its architectural max via cpu-moe and is tagged arch-max', () => {
  const m = entry({ size_gb: 18, ctx: 262144, moe: true, arch: 'qwen35moe', expert_count: 256, active_experts: 8 });
  const est = estimateContextFromCatalog(m, GPU16, 28, 'headless');
  assert.equal(est.expertStrategy, 'cpu-moe');
  assert.equal(est.fit, 'partial-offload');
  assert.equal(est.maxCtx, 262144);            // clamped to trained ctx
  assert.equal(est.provenance, 'arch-max');    // never 'tested' from catalog math
  assert.equal(est.ramTight, false);           // ~17 GB experts fit in 28 GB
  assert.equal(buildFitLabel(est), '✓ 256k');  // runs (estimate), no jargon
});

test('A 30.8 GB MoE on a 30 GB box is "tight", not a hard no (lower ctx may help)', () => {
  const m = entry({ size_gb: 30.8, ctx: 131072, moe: true, arch: 'gpt-oss', expert_count: 80, active_experts: 4 });
  const est = estimateContextFromCatalog(m, GPU16, 28, 'headless');
  assert.equal(est.ramTight, true);            // ~29 GB experts > 28 − reserve
  assert.match(buildFitLabel(est), /^⚠ .*tight$/);   // ⚠ tight, NOT ✗
});

test('Unknown architecture still estimates via a generic fallback (never "?")', () => {
  const m = entry({ size_gb: 10, arch: 'totally-unknown', moe: false });
  const est = estimateContextFromCatalog(m, GPU16, 28, 'headless');
  assert.notEqual(est.fit, 'unknown');          // no more refuse-to-estimate
  assert.ok(est.maxCtx > 0);
  assert.notEqual(buildFitLabel(est), '✗ too big');
});

test('Only a missing size_gb yields "unknown"', () => {
  const m = entry({ size_gb: undefined, arch: 'qwen35moe', moe: true, expert_count: 256, active_experts: 8 });
  const est = estimateContextFromCatalog(m, GPU16, 28, 'headless');
  assert.equal(est.fit, 'unknown');
});

test('A GGUF-derived kv_ptok overrides the arch table (model-dependent)', () => {
  // Same model, two kv_ptok values → the one with the larger KV cost yields less
  // context. Proves the estimate is driven by the per-model GGUF value.
  const base = entry({ size_gb: 8, ctx: 262144, moe: false, arch: 'gemma4' });
  const cheap = estimateContextFromCatalog({ ...base, kv_ptok: 5000 }, GPU16, 28, 'headless', 'vulkan');
  const dear = estimateContextFromCatalog({ ...base, kv_ptok: 50000 }, GPU16, 28, 'headless', 'vulkan');
  assert.ok(cheap.maxCtx >= dear.maxCtx, `${cheap.maxCtx} >= ${dear.maxCtx}`);
  assert.ok(cheap.maxCtx > dear.maxCtx, 'a bigger per-model KV cost must yield less context');
});

test('Backend changes the fit (hardware-dependent overhead)', () => {
  // A dense model big enough that the per-backend VRAM overhead changes max ctx.
  const m = entry({ size_gb: 13, ctx: 262144, moe: false, arch: 'gemma4', kv_ptok: 23040 });
  const cuda = estimateContextFromCatalog(m, GPU16, 28, 'headless', 'cuda');
  const vulkan = estimateContextFromCatalog(m, GPU16, 28, 'headless', 'vulkan');
  assert.ok(cuda.maxCtx >= vulkan.maxCtx, 'leaner CUDA overhead → at least as much ctx as Vulkan');
});

test('quantTier flags IQ3/IQ4 recommended and 1–2 bit not', () => {
  for (const q of ['IQ3_XXS', 'IQ4_XS', 'IQ4_NL']) assert.equal(quantTier(q), 'recommended', q);
  for (const q of ['Q2_K_XL', 'IQ2_M', 'IQ1_S', 'TQ1_0']) assert.equal(quantTier(q), 'not-recommended', q);
  for (const q of ['Q4_K_M', 'Q5_K_M', 'Q8_0', 'Q3_K_M']) assert.equal(quantTier(q), 'ok', q);
});

test('Host profile changes the answer: headless gets more context than desktop', () => {
  const m = entry({ size_gb: 11, ctx: 131072, moe: false, arch: 'gemma4' }); // dense, fits GPU
  const head = estimateContextFromCatalog(m, GPU16, 28, 'headless');
  const desk = estimateContextFromCatalog(m, GPU16, 28, 'desktop');
  assert.ok(head.maxCtx >= desk.maxCtx, `headless ${head.maxCtx} >= desktop ${desk.maxCtx}`);
  assert.ok(head.maxCtx > desk.maxCtx, 'a smaller VRAM reserve should yield more KV budget');
});

test('reservesFor: headless reserves less than desktop', () => {
  const h = reservesFor('headless');
  const d = reservesFor('desktop');
  assert.ok(h.ramReserveGb < d.ramReserveGb);
  assert.ok(h.vramOverheadGb < d.vramOverheadGb);
});

test('detectHostProfile honors RELAY_HOST_PROFILE override', () => {
  assert.equal(detectHostProfile({ RELAY_HOST_PROFILE: 'headless' } as NodeJS.ProcessEnv), 'headless');
  assert.equal(detectHostProfile({ RELAY_HOST_PROFILE: 'desktop' } as NodeJS.ProcessEnv), 'desktop');
  assert.equal(detectHostProfile({ DISPLAY: ':0' } as NodeJS.ProcessEnv), 'desktop');
});

test('buildFitLabel provenance mapping', () => {
  const base: CatalogFitEstimate = { fit: 'full-gpu', maxCtx: 131072, expertStrategy: 'full-gpu', ctxLabel: '128k', provenance: 'calc', ramTight: false };
  assert.equal(buildFitLabel({ ...base, provenance: 'tested' }), '✓ 128k tested');
  assert.equal(buildFitLabel({ ...base, provenance: 'arch-max' }), '✓ 128k');
  assert.equal(buildFitLabel({ ...base, provenance: 'calc' }), '✓ 128k');
  assert.equal(buildFitLabel({ ...base, expertStrategy: 'partial-ngl' }), '⚠ 128k tight');
  assert.equal(buildFitLabel({ ...base, ramTight: true }), '⚠ 128k tight');
  assert.equal(buildFitLabel({ ...base, fit: 'too-large', maxCtx: 0 }), '✗ no');
});

test('every catalog entry yields a non-empty, honest label', async () => {
  const { readCatalog } = await import('../src/setup-logic.ts');
  for (const m of readCatalog()) {
    if (!m.size_gb) continue;
    const est = estimateContextFromCatalog(m, GPU16, 28, 'headless');
    const label = buildFitLabel(est);
    assert.ok(label.length > 0, `empty label for ${m.id}`);
    // Catalog math must never claim a context is empirically tested.
    assert.notEqual(est.provenance, 'tested', `${m.id} wrongly marked tested`);
  }
});
