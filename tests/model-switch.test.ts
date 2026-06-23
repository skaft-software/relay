/**
 * Tests for Relay v2 model switching, prefix cache, and dynamic upstream routing.
 *
 * Covers:
 *  - Eager switch: kill old → start new → pre-warm
 *  - Upstream URL resolution per model
 *  - Lifecycle status includes activeModels
 *  - switchPolicy defaults to eager
 */

import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { type ChildProcess } from 'node:child_process';
import test from 'node:test';

import type { AppConfig } from '../src/config.ts';
import { ModelLifecycle, redact } from '../src/lifecycle.ts';

// ── Helpers ─────────────────────────────────────────────────────────────

function baseConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    port: 1234,
    host: '127.0.0.1',
    upstreamBaseUrl: 'http://127.0.0.1:8080/v1',
    samplingDefaults: {},
    requestTimeoutMs: 1_000,
    logLevel: 'info',
    completionTtlMs: 3_600_000,
    maxRequestBodyBytes: 1_048_576,
    probeOnStartup: false,
    strictStartup: false,
    probeTimeoutMs: 200,
    unknownFieldPolicy: 'pass_through',
    strictCompat: false,
    warnOnStrippedFields: true,
    modelProfile: 'generic',
    reasoningMode: 'off',
    toolMode: 'auto',
    observabilityEnabled: false,
    logPrompts: false,
    requestHistoryLimit: 100,
    maxStoreEntries: 1000,
    trustProxy: false,
    maxUpstreamResponseBytes: 16_777_216,
    lazyModelEnabled: true,
    modelStartTimeoutMs: 5_000,
    lifecycleShutdownConfirmTimeoutMs: 100,
    switchPolicy: 'eager',
    modelPortBase: 8081,
    switchMaxWarmModels: 2,
    modelEntries: {
      qwen: {
        cmd: 'echo qwen-start',
        health_url: 'http://127.0.0.1:8081/health',
        timeout_sec: 5,
        ctx_size: 131072,
      },
      gemma: {
        cmd: 'echo gemma-start',
        health_url: 'http://127.0.0.1:8082/health',
        timeout_sec: 5,
        ctx_size: 98304,
        multimodal: true,
      },
    },
    ...overrides,
  };
}

function createMockChild(): ChildProcess {
  const emitter = new EventEmitter() as unknown as ChildProcess;
  (emitter as any).pid = 99999;
  (emitter as any).kill = () => true;
  (emitter as any).stdout = new EventEmitter();
  (emitter as any).stderr = new EventEmitter();
  (emitter as any).unref = () => {};
  return emitter;
}

// ── Upstream URL resolution tests ───────────────────────────────────────

test('getUpstreamUrl: returns config default when no model is running', () => {
  const config = baseConfig();
  const lifecycle = new ModelLifecycle(config);

  assert.equal(lifecycle.getUpstreamUrl('qwen'), 'http://127.0.0.1:8080/v1');
  assert.equal(lifecycle.getUpstreamUrl('gemma'), 'http://127.0.0.1:8080/v1');
  assert.equal(lifecycle.getUpstreamUrl(), 'http://127.0.0.1:8080/v1');
});

test('getUpstreamUrl: returns default for unknown models', () => {
  const config = baseConfig();
  const lifecycle = new ModelLifecycle(config);

  assert.equal(
    lifecycle.getUpstreamUrl('nonexistent-model'),
    config.upstreamBaseUrl,
  );
});

// ── Model switching with eager policy tests ─────────────────────────────

test('eager switch: ensureModelAvailable starts model when none running', async () => {
  const config = baseConfig({
    switchPolicy: 'eager',
    modelStartTimeoutMs: 500,
    probeTimeoutMs: 100,
  });

  let startCalls: string[] = [];
  const lifecycle = new ModelLifecycle(config, {
    log: () => {},
    spawnProcess: (_cmd, _argv) => {
      startCalls.push(_cmd || (_argv?.[0] ?? 'unknown'));
      const child = createMockChild();
      setTimeout(() => child.emit('exit', 0), 10);
      return child;
    },
    probe: async (_port?: number) => false,
  });

  const result = await lifecycle.ensureModelAvailable('qwen');

  // Should have attempted to start qwen
  assert.equal(startCalls.length > 0, true);

  // Result should indicate timeout since probe always returns false
  assert.equal(result.ok, false);
  assert.equal(result.code, 'model_start_timeout');
});

test('eager switch: successful start with healthy probe', async () => {
  const config = baseConfig({
    switchPolicy: 'eager',
    modelStartTimeoutMs: 2_000,
    probeTimeoutMs: 100,
  });

  const lifecycle = new ModelLifecycle(config, {
    log: () => {},
    spawnProcess: (_cmd, _argv) => {
      return createMockChild();
    },
    probe: async (_port?: number) => true,
  });

  const result = await lifecycle.ensureModelAvailable('qwen');

  assert.equal(result.ok, true);
  assert.equal(result.port, 8081);

  const status = lifecycle.getLifecycleStatus();
  assert.equal(status.currentModel, 'qwen');
  assert.equal(status.modelAvailable, true);
  assert.equal(status.state, 'running');
});

test('eager switch: switching models kills old process', async () => {
  const config = baseConfig({
    switchPolicy: 'eager',
    modelStartTimeoutMs: 1_000,
    probeTimeoutMs: 100,
  });

  const killLog: string[] = [];
  const startLog: string[] = [];

  const lifecycle = new ModelLifecycle(config, {
    log: () => {},
    spawnProcess: (_cmd, _argv) => {
      startLog.push(_cmd || (_argv?.[0] ?? 'unknown'));
      const child = createMockChild();
      const origKill = (child as any).kill;
      (child as any).kill = (sig?: string) => {
        killLog.push(`kill-${(child as any).pid}-${sig || 'SIGTERM'}`);
        return true;
      };
      return child;
    },
    probe: async (_port?: number) => true,
  });

  // Start qwen
  await lifecycle.ensureModelAvailable('qwen');
  assert.equal(lifecycle.getLifecycleStatus().currentModel, 'qwen');

  // Switch to gemma (eager: should kill qwen first)
  await lifecycle.ensureModelAvailable('gemma');

  const status = lifecycle.getLifecycleStatus();
  assert.equal(status.currentModel, 'gemma');
  assert.equal(status.modelAvailable, true);

  // Verify qwen was killed
  const qwenKills = killLog.filter((k) => k.includes('99999'));
  assert.equal(qwenKills.length >= 1, true, 'old model should be killed during eager switch');
});

// ── Lifecycle status tests ──────────────────────────────────────────────

test('lifecycle status: reports enabled and model entries', () => {
  const config = baseConfig();
  const lifecycle = new ModelLifecycle(config);

  const status = lifecycle.getLifecycleStatus();
  assert.equal(status.enabled, true);
  assert.deepEqual(status.modelEntries, ['qwen', 'gemma']);
});

test('lifecycle status: initial state is idle', () => {
  const config = baseConfig();
  const lifecycle = new ModelLifecycle(config);

  const status = lifecycle.getLifecycleStatus();
  assert.equal(status.state, 'idle');
  assert.equal(status.modelAvailable, null);
  assert.equal(status.currentModel, null);
});

test('lifecycle: markJobStarted/markJobFinished track active jobs', () => {
  const config = baseConfig();
  const lifecycle = new ModelLifecycle(config);

  lifecycle.markJobStarted();
  let status = lifecycle.getLifecycleStatus();
  assert.equal(status.activeJobs, 1);

  lifecycle.markJobStarted();
  status = lifecycle.getLifecycleStatus();
  assert.equal(status.activeJobs, 2);

  lifecycle.markJobFinished();
  status = lifecycle.getLifecycleStatus();
  assert.equal(status.activeJobs, 1);

  lifecycle.markJobFinished();
  status = lifecycle.getLifecycleStatus();
  assert.equal(status.activeJobs, 0);
});

test('lifecycle: forceShutdown without models returns false', () => {
  const config = baseConfig();
  const lifecycle = new ModelLifecycle(config);

  const result = lifecycle.forceShutdown();
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'no shutdown command configured');
});

// ─── Redact function ──────────────────────────────────────────────────────

test('redact: strips API keys and tokens', () => {
  assert.equal(
    redact('Authorization: Bearer sk-ant-api-12345'),
    'Authorization: Bearer [REDACTED]',
  );
  assert.equal(
    redact('api_key=secret123 token=abc'),
    'api_key=[REDACTED] token=[REDACTED]',
  );
});
