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
  return { vendor: 'nvidia', vramGb: 24, ramGb: 32, ...overrides };
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

// ── Layout resolution ───────────────────────────────────────────────────────

test('resolveLayout: explicit models dir wins; scripts/logs live under ~/.relay', () => {
  const layout = resolveLayout({}, '/srv/models');
  assert.equal(layout.modelsDir, '/srv/models');
  assert.match(layout.relayHome, /\.relay$/);
  assert.match(layout.scriptsDir, /\.relay\/start-scripts$/);
  assert.match(layout.logsDir, /\.relay\/logs$/);
});
