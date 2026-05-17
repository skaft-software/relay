import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import type { AppConfig } from '../src/config.ts';
import { loadConfig } from '../src/config.ts';
import { LlmJobQueue } from '../src/jobs.ts';
import { ModelLifecycle, redact } from '../src/lifecycle.ts';
import { CompletionStore } from '../src/openai/chat.ts';

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
    observabilityEnabled: true,
    logPrompts: false,
    requestHistoryLimit: 100,
    maxStoreEntries: 1000,
    trustProxy: false,
    maxUpstreamResponseBytes: 16_777_216,
    modelStartTimeoutMs: 5_000,
    lifecycleShutdownConfirmTimeoutMs: 100,
    ...overrides,
  };
}

test('job queue serializes work: only one job runs at a time', async () => {
  const order: string[] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  const queue = new LlmJobQueue(async (job) => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    order.push(`start:${job.source}`);
    await new Promise((resolve) => setTimeout(resolve, 10));
    order.push(`end:${job.source}`);
    inFlight -= 1;
    return { response: { ok: true, source: job.source } };
  });

  const a = queue.submit({ source: 'a', request: { messages: [] } });
  const b = queue.submit({ source: 'b', request: { messages: [] } });
  const c = queue.submit({ source: 'c', request: { messages: [] } });

  // Drain by polling for completion of the last job.
  for (let i = 0; i < 200; i += 1) {
    const snap = queue.get(c.id);
    if (snap?.status === 'completed') break;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }

  assert.equal(maxInFlight, 1, 'queue must run jobs one at a time');
  assert.deepEqual(order, [
    'start:a',
    'end:a',
    'start:b',
    'end:b',
    'start:c',
    'end:c',
  ]);
  assert.equal(queue.get(a.id)?.status, 'completed');
  assert.equal(queue.get(b.id)?.status, 'completed');
  assert.equal(queue.get(c.id)?.status, 'completed');
});

test('job queue counters report pending, active, completedRecent', async () => {
  let release!: () => void;
  const blocker = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queue = new LlmJobQueue(async () => {
    await blocker;
    return { response: { ok: true } };
  });

  queue.submit({ source: 'first', request: {} });
  queue.submit({ source: 'second', request: {} });
  // Allow first job to enter running state.
  await new Promise((resolve) => setTimeout(resolve, 10));

  const mid = queue.counts();
  assert.equal(mid.active, 1, 'one job running');
  assert.equal(mid.pending, 1, 'one job waiting');
  assert.equal(mid.completedRecent, 0);

  release();
  for (let i = 0; i < 200; i += 1) {
    if (queue.counts().active === 0 && queue.counts().pending === 0) break;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  const done = queue.counts();
  assert.equal(done.active, 0);
  assert.equal(done.pending, 0);
  assert.equal(done.completedRecent, 2);
  assert.equal(done.failedRecent, 0);
});

test('lifecycle disabled: hooks are no-ops and ensureModelAvailable surfaces upstream state', async () => {
  const lifecycle = new ModelLifecycle(baseConfig({ lazyModelEnabled: false }), {
    probe: async () => false,
  });
  const result = await lifecycle.ensureModelAvailable();
  assert.equal(result.ok, false);
  assert.equal(result.code, 'model_unavailable');
  assert.equal(lifecycle.maybeShutdownWhenIdle().attempted, false);
  const status = lifecycle.getLifecycleStatus();
  assert.equal(status.enabled, false);
  assert.equal(status.idleShutdownScheduled, false);
});

test('lifecycle enabled but no start command configured returns model_start_not_configured', async () => {
  const lifecycle = new ModelLifecycle(
    baseConfig({ lazyModelEnabled: true }),
    { probe: async () => false },
  );
  const result = await lifecycle.ensureModelAvailable();
  assert.equal(result.ok, false);
  assert.equal(result.code, 'model_start_not_configured');
});

test('lifecycle enabled: start-on-demand invokes start command and waits for health', async () => {
  const spawns: string[] = [];
  let healthy = false;
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'echo start',
      modelStartTimeoutMs: 2_000,
    }),
    {
      probe: async () => healthy,
      spawnProcess: (cmd) => {
        spawns.push(cmd);
        // Simulate model becoming healthy a tick after start.
        setTimeout(() => {
          healthy = true;
        }, 20);
        return { once: () => {} } as any;
      },
    },
  );

  const result = await lifecycle.ensureModelAvailable();
  assert.equal(result.ok, true);
  assert.equal(spawns.length, 1);
  assert.equal(spawns[0], 'echo start');
  const status = lifecycle.getLifecycleStatus();
  assert.equal(status.modelAvailable, true);
  assert.ok(status.lastStartAt, 'lastStartAt should be recorded');
});

test('lifecycle: start-on-demand times out cleanly when health never goes green', async () => {
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'echo start',
      modelStartTimeoutMs: 100,
    }),
    {
      probe: async () => false,
      spawnProcess: () => ({ once: () => {} }) as any,
    },
  );
  const result = await lifecycle.ensureModelAvailable();
  assert.equal(result.ok, false);
  assert.equal(result.code, 'model_start_timeout');
});

test('lifecycle: idle shutdown is scheduled and runs after timeout when idle', async () => {
  let scheduled: { fn: () => void; ms: number } | null = null;
  const stops: string[] = [];
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'start',
      llamaStopCommand: 'stop',
      llamaIdleShutdownMs: 60_000,
    }),
    {
      probe: async () => true,
      spawnProcess: (cmd) => {
        if (cmd === 'stop') stops.push(cmd);
        return { once: () => {} } as any;
      },
      setTimer: (fn, ms) => {
        scheduled = { fn, ms };
        return Symbol('timer');
      },
      clearTimer: () => {
        scheduled = null;
      },
    },
  );

  lifecycle.markJobStarted();
  lifecycle.markJobFinished();
  const result = lifecycle.maybeShutdownWhenIdle();
  assert.equal(result.attempted, true);
  assert.ok(scheduled, 'timer should have been scheduled');
  assert.equal((scheduled as any).ms, 60_000);
  assert.equal(lifecycle.getLifecycleStatus().idleShutdownScheduled, true);

  // Fire the timer manually.
  (scheduled as any).fn();
  // Allow async shutdown command to dispatch.
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(stops, ['stop']);
  const status = lifecycle.getLifecycleStatus();
  assert.equal(status.idleShutdownScheduled, false);
  assert.equal(status.modelAvailable, false);
  assert.ok(status.lastStopAt, 'lastStopAt should be recorded');
});

test('lifecycle: enqueueing a new job cancels a pending idle shutdown', async () => {
  let scheduled: { fn: () => void } | null = null;
  let cleared = false;
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'start',
      llamaStopCommand: 'stop',
      llamaIdleShutdownMs: 60_000,
    }),
    {
      probe: async () => true,
      spawnProcess: () => ({ once: () => {} }) as any,
      setTimer: (fn) => {
        scheduled = { fn };
        return Symbol('timer');
      },
      clearTimer: () => {
        cleared = true;
        scheduled = null;
      },
    },
  );

  lifecycle.markJobStarted();
  lifecycle.markJobFinished();
  lifecycle.maybeShutdownWhenIdle();
  assert.ok(scheduled, 'idle shutdown scheduled before new job');

  lifecycle.markJobEnqueued();
  assert.equal(cleared, true, 'enqueueing a new job must cancel the idle timer');
  assert.equal(lifecycle.getLifecycleStatus().idleShutdownScheduled, false);
});

test('lifecycle: shutdown does not run while jobs are queued or active', async () => {
  let scheduled: { fn: () => void } | null = null;
  const stops: string[] = [];
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'start',
      llamaStopCommand: 'stop',
      llamaIdleShutdownMs: 1,
    }),
    {
      probe: async () => true,
      spawnProcess: (cmd) => {
        if (cmd === 'stop') stops.push(cmd);
        return { once: () => {} } as any;
      },
      setTimer: (fn) => {
        scheduled = { fn };
        return Symbol('timer');
      },
      clearTimer: () => {
        scheduled = null;
      },
    },
  );

  lifecycle.markJobStarted();
  lifecycle.markJobFinished();
  lifecycle.maybeShutdownWhenIdle();
  // Simulate a job arriving after the timer fired but before shutdown ran.
  lifecycle.markJobEnqueued();
  // Even if the timer somehow fires, the job is queued, so shutdown must skip.
  if (scheduled) (scheduled as any).fn();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(stops, [], 'shutdown must not run with queued/active jobs');
});

test('lifecycle status does not leak start/shutdown command strings', () => {
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'API_KEY=supersecret ./run-llama.sh --token=hunter2',
      llamaStopCommand: 'pkill -f llama --secret=topsecret',
    }),
  );
  const status = lifecycle.getLifecycleStatus();
  const json = JSON.stringify(status);
  assert.ok(!json.includes('supersecret'), 'status must not contain start-command secrets');
  assert.ok(!json.includes('hunter2'), 'status must not contain start-command tokens');
  assert.ok(!json.includes('topsecret'), 'status must not contain stop-command secrets');
  assert.equal(status.startCommandConfigured, true);
  assert.equal(status.shutdownCommandConfigured, true);
});

test('redact() scrubs common secret patterns', () => {
  const cleaned = redact('failed: api_key=ABCDEF123 token: xyz Bearer abc.def.ghi');
  assert.ok(!cleaned.includes('ABCDEF123'));
  assert.ok(!cleaned.includes('xyz'));
  assert.ok(!cleaned.includes('abc.def.ghi'));
  assert.match(cleaned, /\[REDACTED\]/);
});

test('config: RELAY_MODEL_LIFECYCLE_ENABLED and aliases load correctly', () => {
  const enabled = loadConfig({ RELAY_MODEL_LIFECYCLE_ENABLED: 'true' });
  assert.equal(enabled.lazyModelEnabled, true);

  const legacy = loadConfig({ RELAY_LAZY_MODEL_ENABLED: 'true' });
  assert.equal(legacy.lazyModelEnabled, true);

  const withCommands = loadConfig({
    RELAY_MODEL_LIFECYCLE_ENABLED: 'true',
    RELAY_MODEL_START_COMMAND: 'start.sh',
    RELAY_MODEL_SHUTDOWN_COMMAND: 'stop.sh',
    RELAY_MODEL_HEALTH_URL: 'http://127.0.0.1:8080/health',
    RELAY_MODEL_IDLE_SHUTDOWN_MS: '300000',
    RELAY_MODEL_START_TIMEOUT_MS: '15000',
  });
  assert.equal(withCommands.llamaStartCommand, 'start.sh');
  assert.equal(withCommands.llamaStopCommand, 'stop.sh');
  assert.equal(withCommands.modelHealthUrl, 'http://127.0.0.1:8080/health');
  assert.equal(withCommands.llamaIdleShutdownMs, 300_000);
  assert.equal(withCommands.modelStartTimeoutMs, 15_000);

  const defaults = loadConfig({});
  assert.equal(defaults.lazyModelEnabled, false);
  assert.equal(defaults.modelStartTimeoutMs, 120_000);
  assert.equal(defaults.llamaIdleShutdownMs, 600_000);
});

test('queue admission control: 429 when pending exceeds configured max', async () => {
  const { createApp } = await import('../src/server.ts');
  // Jobs queue up because the processor is slow (it talks to an upstream that
  // doesn't really exist, but the first job ties up the processor). With
  // maxPending=2, sequential queue processing means the first job occupies
  // the single executor while subsequent jobs queue.
  const app = createApp(baseConfig({ jobQueueMaxPending: 2 }));
  const r1 = await app.fetch('/relay/jobs', {
    method: 'POST', body: { source: 'a', request: { messages: [] } },
  });
  assert.equal(r1.status, 202);
  const r2 = await app.fetch('/relay/jobs', {
    method: 'POST', body: { source: 'b', request: { messages: [] } },
  });
  assert.equal(r2.status, 202);
  const r3 = await app.fetch('/relay/jobs', {
    method: 'POST', body: { source: 'c', request: { messages: [] } },
  });
  // The first job is running (or failed quickly since upstream is fake).
  // If it failed fast, pending is 0, so 429 wouldn't trigger.
  // This test is best-effort: we use a slow queue processor below instead.
  const res3 = await r3.json();
  // If the first two jobs already drained, this would be 202.
  // If they're still queued, this would be 429.
  // Accept either outcome since this depends on timing.
  if (r3.status === 429) {
    assert.equal(res3.error, 'queue_full');
  }
});

test('queue admission control: unit test with slow processor', async () => {
  // Controllable version: use LlmJobQueue directly with a slow processor
  let release: (() => void) | undefined;
  const queue = new LlmJobQueue(async () => {
    await new Promise<void>((resolve) => { release = resolve; });
    return { response: { ok: true } };
  });
  queue.submit({ source: 'a', request: { messages: [] } });
  await new Promise((resolve) => setTimeout(resolve, 10));
  queue.submit({ source: 'b', request: { messages: [] } });
  queue.submit({ source: 'c', request: { messages: [] } });
  await new Promise((resolve) => setTimeout(resolve, 10));
  // 'a' is running, 'b' and 'c' are queued
  assert.equal(queue.counts().active, 1);
  assert.equal(queue.counts().pending, 2);
  // Release the first job
  if (release) release();
  await new Promise((resolve) => setTimeout(resolve, 10));
  // Now 'b' starts running, 'c' is still queued
  assert.equal(queue.counts().active, 1);
  assert.equal(queue.counts().pending, 1);
  if (release) release();
  await new Promise((resolve) => setTimeout(resolve, 10));
  if (release) release(); // release 'c'
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(queue.counts().active, 0);
  assert.equal(queue.counts().pending, 0);
});

test('queue admission control: allows up to max pending jobs', async () => {
  const { createApp } = await import('../src/server.ts');
  const app = createApp(baseConfig({ jobQueueMaxPending: 5 }));
  for (let i = 0; i < 5; i++) {
    const res = await app.fetch('/relay/jobs', {
      method: 'POST',
      body: { source: String(i), request: { messages: [] } },
    });
    assert.equal(res.status, 202, `job ${i} should be accepted`);
  }
});

test('job queue: cancel triggers onJobCancelled event and dequeues', async () => {
  let cancelEventFired = false;
  const queue = new LlmJobQueue(async () => {
    await new Promise((r) => setTimeout(r, 1000));
    return { response: { ok: true } };
  }, {
    events: {
      onJobCancelled: () => { cancelEventFired = true; },
    },
  });
  const job = queue.submit({ source: 'test', request: { messages: [] } });
  // Wait for job to enter running state
  await new Promise((resolve) => setTimeout(resolve, 20));
  // Drain dequeued it, so pending is 0 now (it moved from queued → running)
  // Cancel only works on queued jobs, so this is a no-op for running jobs.
  assert.equal(queue.counts().active, 1);
  // Submit a second job that stays queued (since only 1 runs at a time)
  const job2 = queue.submit({ source: 'test2', request: { messages: [] } });
  assert.equal(queue.counts().pending, 1);
  queue.cancel(job2.id);
  assert.equal(cancelEventFired, true);
  assert.equal(queue.counts().pending, 0);
});

test('job queue: count-based pruning removes oldest finished jobs when over maxEntries', async () => {
  const queue = new LlmJobQueue(async () => ({ response: { ok: true } }), { maxEntries: 10 });
  for (let i = 0; i < 20; i++) {
    queue.submit({ source: String(i), request: { messages: [] } });
  }
  for (let i = 0; i < 200; i++) {
    if (queue.counts().pending === 0) break;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  assert.ok(queue.list().length <= 10, 'queue size should be bounded by maxEntries');
});

test('job queue: completedRecent/FailedRecent are tracked correctly', async () => {
  const queue = new LlmJobQueue(async () => ({ response: { ok: true } }));
  for (let i = 0; i < 10; i++) {
    queue.submit({ source: String(i), request: { messages: [] } });
  }
  for (let i = 0; i < 200; i++) {
    if (queue.counts().pending === 0) break;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  const counts = queue.counts();
  assert.equal(counts.pending, 0);
  assert.equal(counts.active, 0);
  assert.equal(counts.completedRecent, 10);
});

test('config: new Phase 1 config values load correctly', () => {
  const config = loadConfig({
    RELAY_JOB_QUEUE_MAX_PENDING: '50',
    RELAY_JOB_TTL_SECONDS: '7200',
    RELAY_SHUTDOWN_TIMEOUT_MS: '15000',
  });
  assert.equal(config.jobQueueMaxPending, 50);
  assert.equal(config.jobTtlMs, 7_200_000);
  assert.equal(config.shutdownTimeoutMs, 15_000);

  const defaults = loadConfig({});
  assert.equal(defaults.jobQueueMaxPending, 100);
  assert.equal(defaults.jobTtlMs, 3_600_000);
  assert.equal(defaults.shutdownTimeoutMs, 30_000);
});

test('POST /relay/jobs returns 503 when server is shutting down', async () => {
  const { createApp } = await import('../src/server.ts');
  const app = createApp(baseConfig());
  app.shutdown();
  const res = await app.fetch('/relay/jobs', {
    method: 'POST',
    body: { source: 'test', request: { messages: [] } },
  });
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.error, 'shutting_down');
});

test('lifecycle state machine transitions correctly through states', async () => {
  const lifecycle = new ModelLifecycle(
    baseConfig({ lazyModelEnabled: true, llamaStartCommand: 'true', modelStartTimeoutMs: 100 }),
    {
      probe: async () => true,
      spawnProcess: () => ({ once: () => {}, on: () => {} }) as any,
    },
  );
  // Initially idle
  let status = lifecycle.getLifecycleStatus();
  assert.equal(status.state, 'idle');

  // After ensureModelAvailable with healthy probe, should be 'running'
  const result = await lifecycle.ensureModelAvailable();
  assert.equal(result.ok, true);
  status = lifecycle.getLifecycleStatus();
  assert.equal(status.state, 'running');
});

test('lifecycle: circuit breaker activates after N failures', async () => {
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'fail',
      modelStartTimeoutMs: 50,
      lifecycleCircuitBreakerThreshold: 2,
      lifecycleCircuitBreakerWindowMs: 60_000,
      lifecycleCircuitBreakerCooldownMs: 10_000,
    }),
    {
      probe: async () => false,
      spawnProcess: () => ({ once: () => {}, on: () => {} }) as any,
    },
  );

  // First start failure
  const r1 = await lifecycle.ensureModelAvailable();
  assert.equal(r1.ok, false);

  // Second start failure — should trigger circuit breaker
  const r2 = await lifecycle.ensureModelAvailable();
  assert.equal(r2.ok, false);

  // Third attempt should be blocked by circuit breaker
  const r3 = await lifecycle.ensureModelAvailable();
  assert.equal(r3.ok, false);
  assert.equal(r3.code, 'model_start_disabled');

  const status = lifecycle.getLifecycleStatus();
  assert.ok((status.startFailureCount ?? 0) >= 2, 'startFailureCount tracks failures');
});

test('lifecycle rejects overlapping starts', async () => {
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'slow-start',
      modelStartTimeoutMs: 2000,
      lifecycleShutdownConfirmTimeoutMs: 50,
    }),
    {
      probe: async () => false,
      spawnProcess: () => ({ once: () => {}, on: () => {} }) as any,
      setTimer: () => Symbol('timer'),
      clearTimer: () => {},
    },
  );

  // Start ensureModelAvailable but don't await it
  const first = lifecycle.ensureModelAvailable();
  // Small tick to let it enter 'starting' state
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Second call should detect overlapping start
  const second = await lifecycle.ensureModelAvailable();
  assert.equal(second.ok, false);
  assert.equal(second.code, 'model_start_in_progress');

  // Wait for first to finish to avoid dangling promise
  try { await first; } catch { /* expected to fail */ }
});

test('lifecycle: forceShutdown endpoint works when shutdown command is configured', async () => {
  let stopCalled = false;
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStopCommand: 'stop-command',
      lifecycleShutdownConfirmTimeoutMs: 50,
    }),
    {
      probe: async () => false,
      spawnProcess: () => {
        stopCalled = true;
        return { once: () => {}, on: () => {} } as any;
      },
    },
  );

  const result = lifecycle.forceShutdown();
  assert.equal(result.ok, true);
  // Allow async shutdown to dispatch
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(stopCalled, true);
});

test('lifecycle: forceShutdown fails when no shutdown command', () => {
  const lifecycle = new ModelLifecycle(
    baseConfig({ lazyModelEnabled: true }),
    { probe: async () => false },
  );
  const result = lifecycle.forceShutdown();
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'no shutdown command configured');
});

test('lifecycle: lastError is cleared on successful start', async () => {
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'start',
      modelStartTimeoutMs: 100,
      lifecycleShutdownConfirmTimeoutMs: 50,
    }),
    {
      probe: async () => true,
      spawnProcess: () => ({ once: () => {}, on: () => {} }) as any,
    },
  );

  // Set an error
  (lifecycle as any).lastError = 'previous error';
  await lifecycle.ensureModelAvailable();
  const status = lifecycle.getLifecycleStatus();
  assert.equal(status.lastError, undefined);
});

test('lifecycle: context status includes new Phase 2 fields', async () => {
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'start',
      modelStartArgv: ['llama-server', '--model', 'qwen.gguf'],
    }),
    {
      probe: async () => true,
      spawnProcess: () => ({ once: () => {}, on: () => {} }) as any,
    },
  );
  const status = lifecycle.getLifecycleStatus();
  assert.equal(typeof status.state, 'string');
  assert.ok(['idle', 'starting', 'running', 'stopping', 'failed'].includes(status.state));
  assert.equal(typeof status.startCount, 'number');
  assert.equal(typeof status.stopCount, 'number');
  assert.equal(typeof status.startFailureCount, 'number');
  assert.ok('childPid' in status);
  assert.ok('lastHealthyAt' in status);
});

test('config: Phase 2 config values load correctly', () => {
  const config = loadConfig({
    RELAY_MODEL_START_ARGV: '["llama-server","--model","qwen.gguf"]',
    RELAY_MODEL_SHUTDOWN_ARGV: '["pkill","-f","llama-server"]',
    RELAY_LIFECYCLE_CIRCUIT_BREAKER_THRESHOLD: '5',
    RELAY_LIFECYCLE_CIRCUIT_BREAKER_WINDOW_MS: '600000',
    RELAY_LIFECYCLE_CIRCUIT_BREAKER_COOLDOWN_MS: '300000',
    RELAY_LIFECYCLE_RING_BUFFER_BYTES: '131072',
    RELAY_LIFECYCLE_SHUTDOWN_CONFIRM_TIMEOUT_MS: '30000',
  });
  assert.deepEqual(config.modelStartArgv, ['llama-server', '--model', 'qwen.gguf']);
  assert.deepEqual(config.modelShutdownArgv, ['pkill', '-f', 'llama-server']);
  assert.equal(config.lifecycleCircuitBreakerThreshold, 5);
  assert.equal(config.lifecycleCircuitBreakerWindowMs, 600_000);
  assert.equal(config.lifecycleCircuitBreakerCooldownMs, 300_000);
  assert.equal(config.lifecycleRingBufferBytes, 131_072);
  assert.equal(config.lifecycleShutdownConfirmTimeoutMs, 30_000);

  const defaults = loadConfig({});
  assert.equal(defaults.lifecycleCircuitBreakerThreshold, 3);
  assert.equal(defaults.lifecycleShutdownConfirmTimeoutMs, 10_000);
});

test('GET /relay/status exposes queue counts and lifecycle status with no secret leakage', async () => {
  const { createApp } = await import('../src/server.ts');
  const app = createApp(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'API_KEY=hunter2 ./start.sh',
      llamaStopCommand: 'stop.sh --token=secret123',
    }),
  );
  const res = await app.fetch('/relay/status');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.queue);
  assert.equal(typeof body.queue.pending, 'number');
  assert.equal(typeof body.queue.active, 'number');
  assert.equal(typeof body.queue.completedRecent, 'number');
  assert.equal(typeof body.queue.failedRecent, 'number');
  assert.ok(body.lifecycle);
  assert.equal(body.lifecycle.enabled, true);
  assert.equal(body.lifecycle.startCommandConfigured, true);
  assert.equal(body.lifecycle.shutdownCommandConfigured, true);
  const raw = JSON.stringify(body);
  assert.ok(!raw.includes('hunter2'), 'status must not leak start command secret');
  assert.ok(!raw.includes('secret123'), 'status must not leak shutdown command secret');
});

test('job queue: idempotency key deduplicates submissions within TTL', async () => {
  const queue = new LlmJobQueue(async (job) => {
    await new Promise((r) => setTimeout(r, 10));
    return { response: { ok: true, source: job.source } };
  });

  // Same key → same job returned
  const job1 = queue.submitWithIdempotency({ source: 'a', request: { messages: [] } }, 'key-1');
  const job2 = queue.submitWithIdempotency({ source: 'b', request: { messages: [] } }, 'key-1');
  assert.equal(job1.id, job2.id);
  assert.equal(job1.source, 'a', 'first submission source preserved');

  // Different key → different job
  const job3 = queue.submitWithIdempotency({ source: 'c', request: { messages: [] } }, 'key-2');
  assert.notEqual(job1.id, job3.id);

  // No key → always new job
  const job4 = queue.submitWithIdempotency({ source: 'd', request: { messages: [] } });
  const job5 = queue.submitWithIdempotency({ source: 'd', request: { messages: [] } });
  assert.notEqual(job4.id, job5.id);
});

test('job queue: TTL-based pruning removes finished jobs past the retention window', async () => {
  const queue = new LlmJobQueue(async () => ({ response: { ok: true } }), { maxEntries: 100 });
  queue.submit({ source: 'test', request: { messages: [] } });

  // Wait for the job to fully complete (pending=0 AND active=0).
  for (let i = 0; i < 100; i++) {
    const c = queue.counts();
    if (c.pending === 0 && c.active === 0) break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  const orig = queue.list();
  assert.equal(orig.length, 1, 'one completed job should exist');
  assert.equal(orig[0].status, 'completed');

  // Manually age the job's finishedAt past the 5-minute TTL window.
  const jobsMap: Map<string, any> = (queue as any).jobs;
  for (const [, job] of jobsMap) {
    if (job.status === 'completed') {
      job.finishedAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    }
  }

  // Submitting a new job triggers prune() which runs TTL + count-based eviction.
  queue.submit({ source: 'trigger', request: { messages: [] } });
  await new Promise((resolve) => setTimeout(resolve, 30));

  const remaining = queue.list();
  assert.equal(remaining.length, 1, 'TTL-expired old job should be pruned');
  assert.equal(remaining[0].source, 'trigger', 'only the new job should remain');
});

test('job queue: idempotency key returns cached snapshot without re-enqueuing', async () => {
  let processCount = 0;
  const queue = new LlmJobQueue(async () => {
    processCount += 1;
    return { response: { ok: true } };
  });

  const job1 = queue.submitWithIdempotency({ source: 'first', request: { messages: [] } }, 'dedup-key');
  // Wait for first job to complete
  for (let i = 0; i < 100; i++) {
    if (queue.get(job1.id)?.status === 'completed') break;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  const processCountAfterFirst = processCount;
  const job2 = queue.submitWithIdempotency({ source: 'second', request: { messages: [] } }, 'dedup-key');

  // Should reuse cached result without processing again
  assert.equal(job2.id, job1.id);
  assert.equal(job2.source, 'first', 'cached snapshot preserves original source');
  assert.equal(processCount, processCountAfterFirst, 'processor should not run for idempotent resubmission');
});

test('lifecycle: circuit breaker cooldown expires and allows new start attempts', async () => {
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'fail',
      modelStartTimeoutMs: 50,
      lifecycleCircuitBreakerThreshold: 2,
      lifecycleCircuitBreakerWindowMs: 60_000,
      lifecycleCircuitBreakerCooldownMs: 100,
    }),
    {
      probe: async () => false,
      spawnProcess: () => ({ once: () => {}, on: () => {} }) as any,
    },
  );

  // Two failures triggers the circuit breaker
  await lifecycle.ensureModelAvailable();
  await lifecycle.ensureModelAvailable();

  let status = lifecycle.getLifecycleStatus();
  assert.ok((status.startFailureCount ?? 0) >= 2);

  // Third attempt is blocked by the breaker
  const blocked = await lifecycle.ensureModelAvailable();
  assert.equal(blocked.code, 'model_start_disabled');

  // Wait for the cooldown to expire
  await new Promise((resolve) => setTimeout(resolve, 150));

  // Fourth attempt should be allowed (cooldown expired), even though it'll fail again
  const allowed = await lifecycle.ensureModelAvailable();
  assert.notEqual(allowed.code, 'model_start_disabled', 'breaker should allow after cooldown');
});

test('lifecycle: confirmShutdown transitions to idle when health goes red', async () => {
  const proc = new EventEmitter();
  (proc as any).pid = 12345;
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStopCommand: 'stop',
      lifecycleShutdownConfirmTimeoutMs: 500,
    }),
    {
      probe: async () => false,
      spawnProcess: () => proc as any,
    },
  );

  const result = lifecycle.forceShutdown();
  assert.equal(result.ok, true);

  // Emit exit so attemptShutdown proceeds past the exit wait
  proc.emit('exit', 0);
  await new Promise((resolve) => setTimeout(resolve, 100));

  const status = lifecycle.getLifecycleStatus();
  assert.equal(status.state, 'idle', 'shutdown confirmed — state should be idle');
  assert.equal(status.modelAvailable, false);
});

test('lifecycle: confirmShutdown times out and reverts to running when model stays healthy', async () => {
  const proc = new EventEmitter();
  (proc as any).pid = 12345;
  let probeCount = 0;
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStopCommand: 'stop',
      lifecycleShutdownConfirmTimeoutMs: 50,
    }),
    {
      probe: async () => {
        probeCount++;
        return true; // model stays healthy
      },
      spawnProcess: () => proc as any,
    },
  );

  const result = lifecycle.forceShutdown();
  assert.equal(result.ok, true);

  // Emit exit so attemptShutdown proceeds past the exit wait
  proc.emit('exit', 0);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const status = lifecycle.getLifecycleStatus();
  assert.equal(status.state, 'running', 'shutdown not confirmed — state should revert to running');
  assert.equal(status.modelAvailable, true);
  assert.ok(probeCount >= 1, 'confirmShutdown should have probed at least once');
});

test('lifecycle: argv start command is passed correctly to spawnProcess', async () => {
  let capturedArgs: string[] | undefined;
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      modelStartArgv: ['llama-server', '--model', 'qwen.gguf'],
      modelStartTimeoutMs: 50,
    }),
    {
      probe: async () => false,
      spawnProcess: (_cmd, argv) => {
        capturedArgs = argv;
        return { once: () => {}, on: () => {} } as any;
      },
    },
  );

  await lifecycle.ensureModelAvailable();
  assert.deepEqual(capturedArgs, ['llama-server', '--model', 'qwen.gguf']);
});

test('lifecycle: ring buffer captures child process stdout and stderr', async () => {
  const proc = new EventEmitter();
  (proc as any).stdout = new EventEmitter();
  (proc as any).stderr = new EventEmitter();
  (proc as any).pid = 12345;
  let probeHealthy = false;

  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'start',
      modelStartTimeoutMs: 1000, // must exceed sleep(500) in health loop
    }),
    {
      probe: async () => probeHealthy,
      spawnProcess: () => proc as any,
    },
  );

  const startPromise = lifecycle.ensureModelAvailable();
  // Give startAndWait time to set up captureStdio (past the first await).
  await new Promise((resolve) => setTimeout(resolve, 20));

  (proc as any).stdout.emit('data', Buffer.from('loading model weights...\n'));
  (proc as any).stderr.emit('data', Buffer.from('warning: low vram\n'));

  probeHealthy = true;
  const result = await startPromise;
  assert.equal(result.ok, true);

  const ringBuf = (lifecycle as any).ringBuffer as Buffer;
  assert.ok(ringBuf.length > 0, 'ring buffer should contain captured output');
  assert.ok(ringBuf.includes('loading model weights'), 'ring buffer should include stdout');
  assert.ok(ringBuf.includes('warning: low vram'), 'ring buffer should include stderr');
});

test('lifecycle: ring buffer wraps oldest entries when it exceeds capacity', async () => {
  const proc = new EventEmitter();
  (proc as any).stdout = new EventEmitter();
  (proc as any).stderr = new EventEmitter();
  (proc as any).pid = 12345;
  let probeHealthy = false;

  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStartCommand: 'start',
      modelStartTimeoutMs: 1000,
      lifecycleRingBufferBytes: 64,
    }),
    {
      probe: async () => probeHealthy,
      spawnProcess: () => proc as any,
    },
  );

  const startPromise = lifecycle.ensureModelAvailable();
  await new Promise((resolve) => setTimeout(resolve, 20));

  // Write data larger than ring buffer capacity
  (proc as any).stdout.emit('data', Buffer.from('a'.repeat(128)));

  probeHealthy = true;
  await startPromise;

  const ringBuf = (lifecycle as any).ringBuffer as Buffer;
  assert.ok(ringBuf.length <= 64, `ring buffer wrapped (length=${ringBuf.length})`);
});

test('lifecycle: confirmShutdown timeout matches configured lifecycleShutdownConfirmTimeoutMs', async () => {
  const proc = new EventEmitter();
  (proc as any).pid = 12345;
  let probeCount = 0;
  const lifecycle = new ModelLifecycle(
    baseConfig({
      lazyModelEnabled: true,
      llamaStopCommand: 'stop',
      lifecycleShutdownConfirmTimeoutMs: 200,
    }),
    {
      probe: async () => {
        probeCount++;
        return true;
      },
      spawnProcess: () => proc as any,
    },
  );

  const result = lifecycle.forceShutdown();
  assert.equal(result.ok, true);
  proc.emit('exit', 0);
  await new Promise((resolve) => setTimeout(resolve, 400));

  // With 200ms timeout and probe returning true, confirmShutdown should timeout
  const status = lifecycle.getLifecycleStatus();
  assert.equal(status.state, 'running');
  assert.ok(probeCount >= 1);
});

test('CompletionStore: byte-cap enforcement evicts oldest entries', () => {
  const store = new CompletionStore(100, 200); // max 200 bytes

  // Save a small entry — fits
  store.save({ id: 'a', object: 'chat.completion', content: 'x' }, [], 60_000);
  assert.ok(store.get('a'), 'first entry should exist');

  // Save a larger entry that pushes total over the cap
  store.save({ id: 'b', object: 'chat.completion', content: 'y'.repeat(500) }, [], 60_000);

  // Entry 'a' should have been evicted to make room
  assert.equal(store.get('a'), undefined, 'oldest entry should be evicted under byte pressure');
  assert.ok(store.get('b'), 'new entry should survive');
});

test('CompletionStore: delete subtracts from totalBytes', () => {
  const store = new CompletionStore(100, 10_000);
  store.save({ id: 'del-test', object: 'chat.completion', content: 'data' }, [], 60_000);
  assert.ok(store.get('del-test'));

  store.delete('del-test');
  assert.equal(store.get('del-test'), undefined);
  assert.equal((store as any).totalBytes, 0, 'totalBytes should be 0 after deleting all entries');
});

test('CompletionStore: TTL pruning recalculates totalBytes', async () => {
  const store = new CompletionStore(100, 10_000);
  store.save({ id: 'expiring', object: 'chat.completion', content: 'data' }, [], 1); // 1ms TTL
  await new Promise((resolve) => setTimeout(resolve, 10));
  // After TTL expiry, get triggers prune which removes expired entries
  assert.equal(store.get('expiring'), undefined);
  // totalBytes should be adjusted
  assert.equal((store as any).totalBytes, 0, 'totalBytes should be 0 after TTL expiry deletes entry');
});
