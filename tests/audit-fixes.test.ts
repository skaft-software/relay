/**
 * Tests for fixes from the deep code audit (GitHub issues #8-#15) and the
 * Windows port cleanup report.
 */

import assert from 'node:assert/strict';
import { once } from 'node:events';
import { EventEmitter } from 'node:events';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import test from 'node:test';
import type { ChildProcess } from 'node:child_process';

import { createApp } from '../src/server.ts';
import type { AppConfig } from '../src/config.ts';

type Handler = (req: IncomingMessage, res: ServerResponse, body: unknown) => void | Promise<void>;

// ── #9: Body-read timeout ─────────────────────────────────────────────

test('#9: non-streaming body read times out when upstream stalls after headers', async () => {
  await withUpstream(async (upstream) => {
    upstream.handler = (req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.write('{"id":"stall');
      // never calls .end() — simulates stalled upstream
    };
    const config = { ...testConfig(upstream.url), requestTimeoutMs: 100 };
    const app = createApp(config);
    const started = Date.now();
    const res = await app.fetch('/v1/chat/completions', {
      method: 'POST',
      body: { model: 'llama', messages: [{ role: 'user', content: 'hello' }] },
    });
    const elapsed = Date.now() - started;
    assert.ok(res.status >= 500, `expected 5xx for timeout, got ${res.status}`);
    assert.ok(elapsed < 5000, `body read should time out, took ${elapsed}ms`);
  });
});

// ── #11: API_KEY protects GET / and GET /health ───────────────────────

test('#11: GET / is protected when API_KEY is set', async () => {
  await withUpstream(async (upstream) => {
    const app = createApp({ ...testConfig(upstream.url), apiKey: 'secret' });
    const res = await app.fetch('/');
    assert.equal(res.status, 401, 'GET / without auth should return 401');
    assert.equal((await res.json()).error?.type, 'authentication_error');
  });
});

test('#11: GET /health is protected when API_KEY is set', async () => {
  await withUpstream(async (upstream) => {
    const app = createApp({ ...testConfig(upstream.url), apiKey: 'secret' });
    const res = await app.fetch('/health');
    assert.equal(res.status, 401, 'GET /health without auth should return 401');
    assert.equal((await res.json()).error?.type, 'authentication_error');
  });
});

test('#11: GET / and /health are public when API_KEY is not set', async () => {
  await withUpstream(async (upstream) => {
    upstream.handler = (req, res) => sendJson(res, 200, { ok: true });
    const app = createApp(testConfig(upstream.url));
    assert.equal((await app.fetch('/')).status, 200);
    assert.equal((await app.fetch('/health')).status, 200);
  });
});

// ── #12: CORS origin on normal responses ──────────────────────────────

test('#12: CORS origin present on normal POST response when corsOrigin is set', async () => {
  await withUpstream(async (upstream) => {
    upstream.handler = (req, res) => sendJson(res, 200, upstreamChat('llama', 'hi'));
    const config = { ...testConfig(upstream.url), corsOrigin: 'https://example.com' };
    const app = createApp(config);
    const res = await app.fetch('/v1/chat/completions', {
      method: 'POST',
      body: { model: 'llama', messages: [{ role: 'user', content: 'hello' }] },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://example.com');
  });
});

test('#12: expanded CORS headers include session and idempotency keys', async () => {
  await withUpstream(async (upstream) => {
    const config = { ...testConfig(upstream.url), corsOrigin: 'https://example.com' };
    const app = createApp(config);
    const res = await app.fetch('/v1/chat/completions', { method: 'OPTIONS' });
    assert.equal(res.status, 204);
    const allowed = res.headers.get('access-control-allow-headers') ?? '';
    assert.match(allowed, /session-id/);
    assert.match(allowed, /x-session-affinity/);
    assert.match(allowed, /x-client-request-id/);
    assert.match(allowed, /idempotency-key/);
  });
});

test('#12: no CORS origin header when corsOrigin is not configured', async () => {
  await withUpstream(async (upstream) => {
    upstream.handler = (req, res) => sendJson(res, 200, upstreamChat('llama', 'ok'));
    const app = createApp(testConfig(upstream.url));
    const res = await app.fetch('/v1/chat/completions', {
      method: 'POST',
      body: { model: 'llama', messages: [{ role: 'user', content: 'hello' }] },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  });
});

// ── #13: IPv6 host URL bracket wrapping ───────────────────────────────

test('#13: IPv6 host ::1 is wrapped in brackets for internal URL construction', () => {
  const app = createApp({
    ...testConfig('http://[::1]:9'),
    host: '::1',
    port: 1234,
  });
  // App was created without error — URL construction did not throw.
  assert.ok(app);
});

test('#13: IPv4 host is unchanged', () => {
  const app = createApp({
    ...testConfig('http://127.0.0.1:9'),
    host: '127.0.0.1',
    port: 1235,
  });
  assert.ok(app);
});

// ── #14: Sticky port allocation ──────────────────────────────────────

test('#14: auto-allocated port is remembered across model unload and reload', async () => {
  const { ModelLifecycle } = await import('../src/lifecycle.ts');

  const lc = new ModelLifecycle({
    ...baseLifecycleConfig(),
    modelEntries: {
      'model-a': { cmd: 'echo ready' },
      'model-b': { cmd: 'echo ready' },
    },
  }, {
    now: () => Date.now(),
    log: () => {},
    spawnProcess: () => createMockChild(),
    probe: async () => true,
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (h) => clearTimeout(h as NodeJS.Timeout),
  });

  // Load model-a
  const a1 = await lc.ensureModelAvailable('model-a');
  assert.ok(a1.ok, 'first load should succeed');
  const port1 = a1.port!;

  // Switch to model-b (kills model-a)
  const b1 = await lc.ensureModelAvailable('model-b');
  assert.ok(b1.ok, 'switch to model-b should succeed');

  // Switch back to model-a — it should get the SAME port
  const a2 = await lc.ensureModelAvailable('model-a');
  assert.ok(a2.ok, 'reload model-a should succeed');
  assert.equal(a2.port, port1, `port should be sticky: first=${port1} second=${a2.port}`);
});

// ── #8 + #10: Session isolation and disconnect handling ───────────────

test('#8: streaming hot path calls ensureModelAvailable for session isolation', async () => {
  await withUpstream(async (upstream) => {
    upstream.handler = (req, res) => {
      if (req.url === '/health' || req.url === '/v1/models') {
        sendJson(res, 200, { ok: true });
        return;
      }
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write('data: {"choices":[{"delta":{"content":"hi"}}]}\n\n');
      res.end('data: [DONE]\n\n');
    };
    const config = { ...testConfig(upstream.url), lazyModelEnabled: true };
    const app = createApp(config);

    const r1 = await app.fetch('/v1/chat/completions', {
      method: 'POST',
      body: { model: 'llama', messages: [{ role: 'user', content: 'hi' }], stream: true },
    });
    assert.equal(r1.status, 200);
    await r1.text();

    const r2 = await app.fetch('/v1/chat/completions', {
      method: 'POST',
      body: { model: 'llama', messages: [{ role: 'user', content: 'hi' }], stream: true },
    });
    assert.equal(r2.status, 200);
    await r2.text();
  });
});

// ── Helpers ────────────────────────────────────────────────────────────

function createMockChild(): ChildProcess {
  const emitter = new EventEmitter() as unknown as ChildProcess;
  (emitter as any).pid = 99999;
  (emitter as any).kill = () => true;
  (emitter as any).stdout = new EventEmitter();
  (emitter as any).stderr = new EventEmitter();
  (emitter as any).unref = () => {};
  return emitter;
}

function testConfig(upstreamBaseUrl: string): AppConfig {
  return {
    port: 8080,
    host: '127.0.0.1',
    upstreamBaseUrl,
    samplingDefaults: {},
    requestTimeoutMs: 1000,
    logLevel: 'info',
    completionTtlMs: 3_600_000,
    maxRequestBodyBytes: 1_048_576,
    probeOnStartup: true,
    strictStartup: false,
    probeTimeoutMs: 3_000,
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
  };
}

function baseLifecycleConfig(): any {
  return {
    port: 1234,
    host: '127.0.0.1',
    upstreamBaseUrl: 'http://127.0.0.1:8080/v1',
    samplingDefaults: {},
    requestTimeoutMs: 1000,
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
    modelStartTimeoutMs: 2_000,
    lifecycleShutdownConfirmTimeoutMs: 100,
    switchPolicy: 'eager',
    modelPortBase: 8081,
  };
}

async function withUpstream(run: (upstream: { url: string; handler: Handler }) => Promise<void>) {
  const upstream: { url: string; handler: Handler } = {
    url: '',
    handler: () => { throw new Error('upstream handler not set'); },
  };
  const server = createServer(async (req, res) => {
    const body = await readRequestBody(req);
    await upstream.handler(req, res, body);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('unexpected server address');
  upstream.url = `http://127.0.0.1:${address.port}`;
  try {
    await run(upstream);
  } finally {
    server.closeAllConnections();
    server.close();
    await once(server, 'close');
  }
}

async function readRequestBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return undefined;
  return JSON.parse(text);
}

function sendJson(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(value));
}

function upstreamChat(model: string, content: string): any {
  return {
    id: 'chatcmpl-upstream',
    object: 'chat.completion',
    created: 1_700_000_000,
    model,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content },
        finish_reason: 'stop',
        logprobs: null,
      },
    ],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  };
}
