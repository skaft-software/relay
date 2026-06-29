/**
 * Smoke + unit tests for the provisioning engine (src/provision.ts).
 *
 * Covers the pure, hardware-independent surface that ships in the CLI:
 *  - parseProvisionArgs: flag parsing and the apply/dry-run safety gate
 *  - selectBackend: vendor preference vs. detected backend
 *  - resolveLayout: ~/.relay path derivation
 *  - fitModel: VRAM/RAM fit classification and MoE offload planning
 *
 * Live hardware probing (detectHardware) and host mutation (applyProvision)
 * are integration-only and intentionally not exercised here.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseProvisionArgs,
  selectBackend,
  resolveLayout,
  fitModel,
  parseListDevices,
  parseNvidiaSmi,
  summarizeGpus,
  gpuVendor,
  gpuLaunchFlags,
  formatHardware,
  planGpuPlacement,
  effectiveSizingVramGb,
  type Hardware,
  type ModelFile,
} from '../src/provision.ts';

// ── Helpers ───────────────────────────────────────────────────────────────

function model(overrides: Partial<ModelFile> = {}): ModelFile {
  return {
    id: 'test-model',
    label: 'Test Model',
    path: '/models/test.gguf',
    sizeGb: 4,
    quant: 'Q4_K_M',
    moe: false,
    vision: false,
    shards: 1,
    incomplete: false,
    ...overrides,
  };
}

function hw(overrides: Partial<Hardware> = {}): Hardware {
  const base: Hardware = {
    vendor: 'nvidia', vramGb: 24, ramGb: 32,
    gpus: [{ index: 0, device: 'CUDA0', name: 'NVIDIA Test', vramGb: 24 }],
    gpuCount: 1, maxGpuVramGb: 24, totalGpuVramGb: 24,
  };
  return { ...base, ...overrides };
}

// ── CLI argument parsing / safety gate ─────────────────────────────────────

test('parseProvisionArgs: defaults to dry-run (apply=false)', () => {
  const opts = parseProvisionArgs([]);
  assert.equal(opts.apply, false);
  assert.equal(opts.profile, 'full');
  assert.equal(opts.backend, 'auto');
  assert.equal(opts.help, false);
});

test('parseProvisionArgs: --apply is the only path that opts into mutation', () => {
  assert.equal(parseProvisionArgs(['--apply']).apply, true);
  // anything else stays dry-run
  assert.equal(parseProvisionArgs(['--smoke', '--skip-build']).apply, false);
});

test('parseProvisionArgs: -h/--help sets help and stays dry-run', () => {
  for (const flag of ['--help', '-h']) {
    const opts = parseProvisionArgs([flag]);
    assert.equal(opts.help, true);
    assert.equal(opts.apply, false);
  }
});

test('parseProvisionArgs: profile/backend parse, rocm folds to hip, junk ignored', () => {
  assert.equal(parseProvisionArgs(['--profile', 'nano']).profile, 'nano');
  assert.equal(parseProvisionArgs(['--backend', 'cuda']).backend, 'cuda');
  assert.equal(parseProvisionArgs(['--backend', 'rocm']).backend, 'hip');
  // invalid values fall back to defaults rather than throwing
  assert.equal(parseProvisionArgs(['--profile', 'bogus']).profile, 'full');
  assert.equal(parseProvisionArgs(['--backend', 'bogus']).backend, 'auto');
});

test('parseProvisionArgs: skip flags and smoke', () => {
  const opts = parseProvisionArgs(['--skip-build', '--skip-docker', '--smoke']);
  assert.equal(opts.skipBuild, true);
  assert.equal(opts.skipDocker, true);
  assert.equal(opts.smoke, true);
});

// ── Backend selection ───────────────────────────────────────────────────────

test('selectBackend: honors a detected GPU backend the vendor supports', () => {
  assert.equal(selectBackend('nvidia', 'cuda'), 'cuda');
  assert.equal(selectBackend('amd', 'vulkan'), 'vulkan');
  assert.equal(selectBackend('apple', 'metal'), 'metal');
});

test('selectBackend: falls back to top vendor preference otherwise', () => {
  assert.equal(selectBackend('nvidia', 'unknown'), 'cuda');
  assert.equal(selectBackend('nvidia', 'cpu'), 'cuda');
  // cuda is not in amd's preference list → use amd's top pref
  assert.equal(selectBackend('amd', 'cuda'), 'vulkan');
  assert.equal(selectBackend('none', 'unknown'), 'cpu');
});

// ── Model fit classification ────────────────────────────────────────────────

test('fitModel: small model fits fully on GPU', () => {
  const f = fitModel(model({ sizeGb: 4 }), hw({ vramGb: 24, ramGb: 32 }));
  assert.equal(f.fit, 'full-gpu');
  assert.equal(f.ngl, 999);
  assert.equal(f.ctxSize, 32768);
  assert.equal(f.cpuMoe, undefined);
});

test('fitModel: oversized-for-VRAM model spills to partial offload', () => {
  const f = fitModel(model({ sizeGb: 30 }), hw({ vramGb: 24, ramGb: 64 }));
  assert.equal(f.fit, 'partial-offload');
  assert.equal(f.ngl, 0);
  assert.equal(f.ctxSize, 16384);
});

test('fitModel: model exceeding VRAM+RAM budget is too-large', () => {
  const f = fitModel(model({ sizeGb: 200 }), hw({ vramGb: 24, ramGb: 32 }));
  assert.equal(f.fit, 'too-large');
  assert.equal(f.ngl, 0);
  assert.equal(f.ctxSize, 8192);
});

test('fitModel: incomplete model is unknown with no offload', () => {
  const f = fitModel(model({ incomplete: true }), hw());
  assert.equal(f.fit, 'unknown');
  assert.equal(f.ngl, 0);
  assert.equal(f.ctxSize, 0);
});

test('fitModel: nano profile uses smaller context windows', () => {
  const f = fitModel(model({ sizeGb: 4 }), hw(), 'nano');
  assert.equal(f.fit, 'full-gpu');
  assert.equal(f.ctxSize, 16384);
});

test('fitModel: MoE partial-offload emits a layered --n-cpu-moe flag', () => {
  const f = fitModel(model({ sizeGb: 30, moe: true }), hw({ vramGb: 24, ramGb: 64 }));
  assert.equal(f.fit, 'partial-offload');
  assert.match(f.cpuMoe ?? '', /^--n-cpu-moe \d+$/);
});

test('fitModel: MoE too-large offloads all experts to CPU', () => {
  const f = fitModel(model({ sizeGb: 200, moe: true }), hw({ vramGb: 24, ramGb: 32 }));
  assert.equal(f.fit, 'too-large');
  assert.equal(f.cpuMoe, '--cpu-moe');
});

test('fitModel: multi-GPU budget can make a model a full GPU fit', () => {
  const multi = hw({
    vramGb: 24,
    maxGpuVramGb: 24,
    totalGpuVramGb: 48,
    gpuCount: 2,
    gpus: [
      { index: 0, device: 'CUDA0', name: 'RTX 3090', vramGb: 24 },
      { index: 1, device: 'CUDA1', name: 'RTX 3090', vramGb: 24 },
    ],
  });
  const f = fitModel(model({ sizeGb: 40 }), multi);
  assert.equal(f.fit, 'full-gpu');
});

// ── Layout resolution ───────────────────────────────────────────────────────

test('resolveLayout: explicit models dir wins; scripts/logs live under ~/.relay', () => {
  const layout = resolveLayout({}, '/srv/models');
  assert.equal(layout.modelsDir, '/srv/models');
  assert.match(layout.relayHome, /\.relay$/);
  assert.match(layout.scriptsDir, /\.relay\/start-scripts$/);
  assert.match(layout.logsDir, /\.relay\/logs$/);
});

// ── GPU enumeration: --list-devices (authoritative, cross-vendor) ─────────────

test('parseListDevices: single AMD Vulkan card with free VRAM', () => {
  // Real output from the RX 9070 XT box this was developed on.
  const out = 'WARNING: radv is not a conformant Vulkan implementation, testing use only.\n' +
    'Available devices:\n' +
    '  Vulkan0: AMD Radeon RX 9070 XT (RADV GFX1201) (16304 MiB, 6345 MiB free)\n';
  const gpus = parseListDevices(out);
  assert.equal(gpus.length, 1);
  assert.deepEqual(gpus[0], { index: 0, device: 'Vulkan0', name: 'AMD Radeon RX 9070 XT (RADV GFX1201)', vramGb: 16, freeVramGb: 6 });
});

test('parseListDevices: two NVIDIA CUDA cards (device handles match --device)', () => {
  const out = 'Available devices:\n' +
    '  CUDA0: NVIDIA GeForce RTX 3090 (24576 MiB, 24000 MiB free)\n' +
    '  CUDA1: NVIDIA GeForce RTX 3090 (24576 MiB, 23900 MiB free)\n';
  const gpus = parseListDevices(out);
  assert.equal(gpus.length, 2);
  assert.deepEqual(gpus.map((g) => g.device), ['CUDA0', 'CUDA1']);
  assert.equal(summarizeGpus(gpus, gpuVendor(gpus[0]!.device, gpus[0]!.name)).vendor, 'nvidia');
});

test('parseListDevices: heterogeneous multi-GPU (24G + 8G) without free column', () => {
  const out = '  CUDA0: NVIDIA RTX 3090 (24576 MiB)\n  CUDA1: NVIDIA RTX 3070 (8192 MiB)\n';
  const gpus = parseListDevices(out);
  const sum = summarizeGpus(gpus, 'nvidia');
  assert.equal(sum.gpuCount, 2);
  assert.equal(sum.maxGpuVramGb, 24);
  assert.equal(sum.totalGpuVramGb, 32);
  assert.equal(sum.vramGb, 24); // single-model budget = largest card
  assert.equal(gpus[0]!.freeVramGb, undefined);
});

test('parseListDevices: ignores non-device lines and CPU entries', () => {
  const out = 'Available devices:\n  CPU: AMD Ryzen (no VRAM)\n  garbage line\n';
  assert.equal(parseListDevices(out).length, 0);
});

test('gpuVendor: classifies by device prefix then by name', () => {
  assert.equal(gpuVendor('CUDA0', 'whatever'), 'nvidia');
  assert.equal(gpuVendor('ROCm0', 'AMD'), 'amd');
  assert.equal(gpuVendor('Vulkan0', 'AMD Radeon RX 9070 XT'), 'amd');
  assert.equal(gpuVendor('Vulkan0', 'NVIDIA GeForce RTX 4090'), 'nvidia');
  assert.equal(gpuVendor('Metal0', 'Apple M3 Max'), 'apple');
});

// ── GPU enumeration: nvidia-smi fallback (reads EVERY GPU, not just line 0) ────

test('parseNvidiaSmi: parses all GPUs (regression: previously read only line 0)', () => {
  const out = '0, NVIDIA GeForce RTX 3090, 24576\n1, NVIDIA GeForce RTX 3090, 24576\n';
  const gpus = parseNvidiaSmi(out);
  assert.equal(gpus.length, 2);
  assert.equal(summarizeGpus(gpus, 'nvidia').totalGpuVramGb, 48);
  assert.equal(summarizeGpus(gpus, 'nvidia').vramGb, 24);
});

test('summarizeGpus: empty list collapses to vendor none', () => {
  const sum = summarizeGpus([], 'nvidia');
  assert.equal(sum.vendor, 'none');
  assert.equal(sum.gpuCount, 0);
  assert.equal(sum.totalGpuVramGb, 0);
});

// ── GpuConfig → llama.cpp launch flags ───────────────────────────────────────

test('gpuLaunchFlags: maps every field to its llama.cpp flag', () => {
  const flags = gpuLaunchFlags({
    device: 'CUDA0,CUDA1', splitMode: 'layer', tensorSplit: [3, 1],
    mainGpu: 0, gpuLayers: 'all', fit: true, fitTarget: [1024, 512],
  });
  const flat = flags.map((p) => p.join(' '));
  assert.ok(flat.includes('--device CUDA0,CUDA1'));
  assert.ok(flat.includes('--split-mode layer'));
  assert.ok(flat.includes('--tensor-split 3,1'));
  assert.ok(flat.includes('--main-gpu 0'));
  assert.ok(flat.includes('-ngl 999'));
  assert.ok(flat.includes('--fit on'));
  assert.ok(flat.includes('--fit-target 1024,512'));
});

test('gpuLaunchFlags: exact gpuLayers number, fit off, and no duplicates of present flags', () => {
  const flags = gpuLaunchFlags({ gpuLayers: 20, fit: false, device: 'CUDA0' }, new Set(['-ngl', '--device']));
  const flat = flags.map((p) => p.join(' '));
  assert.ok(!flat.some((f) => f.startsWith('-ngl')));      // already present → skipped
  assert.ok(!flat.some((f) => f.startsWith('--device')));  // already present → skipped
  assert.ok(flat.includes('--fit off'));
});

test('gpuLaunchFlags: empty config emits nothing', () => {
  assert.deepEqual(gpuLaunchFlags({}), []);
});

test('planGpuPlacement: multi-GPU uses llama.cpp device handles with layer split', () => {
  const multi = hw({
    vendor: 'nvidia', vramGb: 24, maxGpuVramGb: 24, totalGpuVramGb: 48, gpuCount: 2,
    gpus: [
      { index: 0, device: 'CUDA0', name: 'RTX 3090', vramGb: 24 },
      { index: 1, device: 'CUDA1', name: 'RTX 3090', vramGb: 24 },
    ],
  });
  const placement = planGpuPlacement(multi);
  assert.deepEqual(placement?.config, {
    device: 'CUDA0,CUDA1',
    splitMode: 'layer',
    tensorSplit: [24, 24],
  });
  assert.equal(placement?.effectiveVramGb, 46);
  assert.equal(effectiveSizingVramGb(multi), 46);
});

test('planGpuPlacement: excludes tiny integrated GPUs from split plans', () => {
  const mixed = hw({
    vendor: 'amd', vramGb: 16, maxGpuVramGb: 16, totalGpuVramGb: 18, gpuCount: 2,
    gpus: [
      { index: 0, device: 'Vulkan0', name: 'AMD Radeon RX 7900', vramGb: 16 },
      { index: 1, device: 'Vulkan1', name: 'AMD integrated graphics', vramGb: 2 },
    ],
  });
  assert.deepEqual(planGpuPlacement(mixed)?.config, { device: 'Vulkan0' });
  assert.equal(effectiveSizingVramGb(mixed), 16);
});

// ── Honest hardware reporting ────────────────────────────────────────────────

test('formatHardware: single GPU', () => {
  const line = formatHardware(hw({ vendor: 'amd', gpuName: 'AMD Radeon RX 9070 XT', vramGb: 16, ramGb: 31,
    gpus: [{ index: 0, device: 'Vulkan0', name: 'AMD Radeon RX 9070 XT', vramGb: 16 }],
    gpuCount: 1, maxGpuVramGb: 16, totalGpuVramGb: 16 }));
  assert.equal(line, 'amd · 1 GPU · AMD Radeon RX 9070 XT · 16GB · 16GB total VRAM · 31GB RAM');
});

test('formatHardware: uniform multi-GPU says "each"; mixed lists each card', () => {
  const uniform = formatHardware(hw({ vendor: 'nvidia', gpuName: 'RTX 3090', vramGb: 24, ramGb: 64,
    gpus: [{ index: 0, device: 'CUDA0', name: 'RTX 3090', vramGb: 24 }, { index: 1, device: 'CUDA1', name: 'RTX 3090', vramGb: 24 }],
    gpuCount: 2, maxGpuVramGb: 24, totalGpuVramGb: 48 }));
  assert.match(uniform, /2 GPUs .* 24GB each · 48GB total VRAM/);
  const mixed = formatHardware(hw({ vendor: 'nvidia', gpuName: 'RTX 3090', vramGb: 24, ramGb: 64,
    gpus: [{ index: 0, device: 'CUDA0', name: 'RTX 3090', vramGb: 24 }, { index: 1, device: 'CUDA1', name: 'RTX 3070', vramGb: 8 }],
    gpuCount: 2, maxGpuVramGb: 24, totalGpuVramGb: 32 }));
  assert.match(mixed, /24GB \+ 8GB · 32GB total VRAM/);
});

test('formatHardware: no GPU', () => {
  assert.equal(
    formatHardware(hw({ vendor: 'none', gpus: [], gpuCount: 0, maxGpuVramGb: 0, totalGpuVramGb: 0, vramGb: 0, ramGb: 31 })),
    'none · no GPU · CPU only · 31GB RAM',
  );
});
