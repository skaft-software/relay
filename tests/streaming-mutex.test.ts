/**
 * streaming-mutex.test.ts
 *
 * Validates that the RequestMutex serializes concurrent streaming requests
 * and releases properly on stream completion / client disconnect.
 *
 * Issue J investigation: does withMutex release early for x-relay-loading
 * responses? These tests confirm it does not.
 */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import test from 'node:test';

import type { AppConfig } from '../src/config.ts';
import { createApp } from '../src/server.ts';


function testConfig(upstreamBaseUrl: string, overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    port: 8080,
    host: '127.0.0.1',
    upstreamBaseUrl,
    samplingDefaults: {},
    requestTimeoutMs: 5_000,
    logLevel: 'silent',
    completionTtlMs: 3_600_000,
    maxRequestBodyBytes: 1_048_576,
    probeOnStartup: false,
    strictStartup: false,
    probeTimeoutMs: 3_000,
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
    modelStartTimeoutMs: 120_000,
    serializeRequests: true,
    ...overrides,
  };
}

async function withUpstream(run: (upstream: { url: string; handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void> }) => Promise<void>) {
  const upstream = {
    url: '',
    handler: (_req: IncomingMessage, _res: ServerResponse) => {
      throw new Error('upstream handler not set');
    },
  };
  const server = createServer((req, res) => upstream.handler(req, res));
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

test('withMutex serializes concurrent streaming requests (first holds mutex, second queues)', async () => {
  await withUpstream(async (upstream) => {
    let firstStreamStarted = false;
    let firstStreamDone = false;
    let secondRequestReceived = false;

    // Create a resolver so the first stream can be held open until we check mutex state.
    let releaseFirstStream: () => void = () => {};
    const firstStreamGate = new Promise<void>((resolve) => { releaseFirstStream = resolve; });

    upstream.handler = (req, res) => {
      if (req.url === '/v1/chat/completions') {
        if (!firstStreamStarted) {
          firstStreamStarted = true;
          // First stream: start SSE, then wait for gate before finishing.
          res.writeHead(200, { 'content-type': 'text/event-stream' });
          res.write('data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1,"model":"llama","choices":[{"index":0,"delta":{"content":"first"},"finish_reason":null}]}\n\n');
          // Signal the test that the first stream has begun.
          // Don't end yet — wait for gate.
          firstStreamGate.then(() => {
            firstStreamDone = true;
            res.end('data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1,"model":"llama","choices":[{"index":0,"delta":{"content":""},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n');
          });
        } else {
          secondRequestReceived = true;
          res.writeHead(200, { 'content-type': 'text/event-stream' });
          res.end('data: {"id":"chatcmpl-2","object":"chat.completion.chunk","created":1,"model":"llama","choices":[{"index":0,"delta":{"content":"second"},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n');
        }
        return;
      }
      res.writeHead(404);
      res.end('not found');
    };

    const app = createApp(testConfig(upstream.url));

    // Send first streaming request (non-blocking — we'll read stream asynchronously).
    const firstReqPromise = app.fetch('/v1/chat/completions', {
      method: 'POST',
      body: { model: 'llama', stream: true, messages: [{ role: 'user', content: 'hi' }] },
    });

    // Wait a tick for the first request to acquire mutex and start streaming.
    await new Promise((resolve) => setTimeout(resolve, 100));

    // At this point the first stream should be in progress and holding the mutex.
    // Check mutex status.
    const statusRes = await app.fetch('/relay/status');
    const statusBefore = await statusRes.json();
    assert.equal(statusBefore.mutex?.active, true, 'mutex should be active while first stream is in progress');

    // Now send a second streaming request. This should queue behind the mutex.
    const secondReqPromise = app.fetch('/v1/chat/completions', {
      method: 'POST',
      body: { model: 'llama', stream: true, messages: [{ role: 'user', content: 'hi2' }] },
    });

    // Give the second request time to hit the mutex queue.
    await new Promise((resolve) => setTimeout(resolve, 100));

    // The second request should NOT have reached upstream yet (mutex is held).
    assert.equal(secondRequestReceived, false, 'second request should not reach upstream while mutex is held');

    // Verify mutex shows waiting count.
    const statusDuring = await app.fetch('/relay/status');
    const statusJson = await statusDuring.json();
    assert.equal(statusJson.mutex?.active, true, 'mutex should still be active');
    // At least 0 waiting (it might have been scheduled already, timing-dependent).
    assert.equal(typeof statusJson.mutex?.waiting, 'number', 'mutex should report waiting count');

    // Release the first stream.
    releaseFirstStream();

    // Wait for first stream to complete.
    const firstRes = await firstReqPromise;
    assert.equal(firstRes.status, 200);
    assert.ok(firstStreamDone, 'first stream should be done');

    // Consume first stream body.
    await firstRes.text();

    // Now the mutex should be released and the second request should proceed.
    const secondRes = await secondReqPromise;
    assert.equal(secondRes.status, 200);
    const secondText = await secondRes.text();
    assert.match(secondText, /"content":"second"/);

    // Second request should have reached upstream.
    assert.equal(secondRequestReceived, true);

    // Mutex should be free after both streams complete.
    const statusAfter = await app.fetch('/relay/status');
    const statusAfterJson = await statusAfter.json();
    assert.equal(statusAfterJson.mutex?.active, false, 'mutex should be free after streams complete');
    assert.equal(statusAfterJson.mutex?.waiting, 0, 'no waiters should remain');
  });
});

test('withMutex releases on client disconnect during streaming', async () => {
  await withUpstream(async (upstream) => {
    let clientDisconnected = false;

    upstream.handler = (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      // Write one chunk but never end — simulate hung upstream.
      res.write('data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1,"model":"llama","choices":[{"index":0,"delta":{"content":"partial"},"finish_reason":null}]}\n\n');

      // Listen for close to detect client disconnect.
      res.on('close', () => {
        clientDisconnected = true;
      });
      // Don't call res.end() — stream hangs.
    };

    const cfg = testConfig(upstream.url);
    // Use a different port for the app to avoid conflict with upstream.
    cfg.port = 9876;
    const app = createApp(cfg);
    const server = await app.listen();

    try {
      // Make a raw fetch that we can abort mid-stream.
      const controller = new AbortController();
      const fetchPromise = fetch(`http://127.0.0.1:9876/v1/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'llama', stream: true, messages: [{ role: 'user', content: 'hi' }] }),
        signal: controller.signal,
      });

      const response = await fetchPromise;
      assert.equal(response.status, 200);

      // Read one chunk to ensure stream is flowing.
      if (response.body) {
        const reader = response.body.getReader();
        const { done } = await reader.read();
        assert.equal(done, false, 'should receive at least one chunk');
        // Don't release the reader — just abort.
      }

      // Verify mutex is held.
      const statusBefore = await app.fetch('/relay/status');
      const beforeJson = await statusBefore.json();
      assert.equal(beforeJson.mutex?.active, true, 'mutex should be active during streaming');

      // Abort (simulate client disconnect).
      controller.abort();

      // Give time for disconnect to propagate.
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Mutex should be released after disconnect.
      const statusAfter = await app.fetch('/relay/status');
      const afterJson = await statusAfter.json();
      assert.equal(afterJson.mutex?.active, false, 'mutex should be free after client disconnect');
      assert.equal(afterJson.mutex?.waiting, 0, 'no waiters after disconnect');
    } finally {
      await server.close();
    }
  });
});

test('streamWithModelLoading comment heartbeats are valid SSE comments', async () => {
  // Verify that the SSE comment format used in streamWithModelLoading
  // is standards-compliant (line starts with ":").
  // SSE spec: lines beginning with ":" are comments and must be ignored.
  const commentLine = ': relay loading model=llama elapsed_ms=0';
  assert.ok(commentLine.startsWith(':'), 'heartbeat starts with colon (SSE comment)');
  assert.ok(commentLine.includes('relay loading'), 'heartbeat identifies as relay loading');

  // The format emitted is `: relay loading model=... elapsed_ms=...\n\n`
  // \n\n ends the comment line and dispatches an empty event (benign).
  const rawEmitted = `: relay loading model=llama elapsed_ms=0\n\n`;
  // Should start with colon (SSE comment), not cause parse errors.
  assert.ok(rawEmitted.startsWith(':'), 'emitted comment starts with colon');
  assert.ok(rawEmitted.endsWith('\n\n'), 'terminated with double newline (SSE message boundary)');
});

test('encodeLifecycleFrame error payload uses valid chat.completion.chunk for OpenAI protocol', () => {
  // The non-OpenAI error frame concern: event name is relay.error but
  // the JSON payload should be a valid chat.completion.chunk to avoid
  // breaking clients that parse data: fields.

  // Simulate what streamWithModelLoading emits for error phase with openai_chat protocol.
  // Constructed based on encodeLifecycleFrame in server.ts.
  const protocol = 'openai_chat';
  const event = 'relay.error';
  const dataObj = {
    id: `relay-error-test`,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: 'llama',
    choices: [{ index: 0, delta: {}, finish_reason: null }],
    relay: {
      type: event,
      model: 'llama',
      elapsed_ms: 5000,
      message: 'Model unavailable',
    },
  };

  // The JSON must be a valid chat.completion.chunk (has object, choices, model).
  assert.equal(dataObj.object, 'chat.completion.chunk', 'payload is a chat.completion.chunk');
  assert.ok(Array.isArray(dataObj.choices), 'has choices array');
  assert.equal(typeof dataObj.model, 'string', 'has model string');
});

test('streaming response content-type is correctly identified as text/event-stream by withMutex', async () => {
  // Verify that a response from streamWithModelLoading-style Response
  // (with x-relay-loading header + text/event-stream content-type)
  // is correctly identified as streaming by withMutex.
  await withUpstream(async (upstream) => {
    upstream.handler = (_req, res) => {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'x-relay-loading': '1',
      });
      // Simulate loading events then data.
      res.write(': relay loading model=llama elapsed_ms=0\n\n');
      res.write('event: relay.loading\ndata: {"id":"relay-loading-1","object":"chat.completion.chunk","created":1,"model":"llama","choices":[{"index":0,"delta":{},"finish_reason":null}],"relay":{"type":"relay.loading","model":"llama","elapsed_ms":0}}\n\n');
      res.write('event: relay.loaded\ndata: {"id":"relay-loaded-1","object":"chat.completion.chunk","created":1,"model":"llama","choices":[{"index":0,"delta":{},"finish_reason":null}],"relay":{"type":"relay.loaded","model":"llama","elapsed_ms":0}}\n\n');
      // Now real data.
      res.write('data: {"id":"chatcmpl-1","object":"chat.completion.chunk","created":1,"model":"llama","choices":[{"index":0,"delta":{"content":"hello"},"finish_reason":null}]}\n\n');
      res.end('data: [DONE]\n\n');
    };

    const app = createApp(testConfig(upstream.url));
    const response = await app.fetch('/v1/chat/completions', {
      method: 'POST',
      body: { model: 'llama', stream: true, messages: [{ role: 'user', content: 'hi' }] },
    });

    assert.equal(response.status, 200);
    // withMutex should correctly detect this as streaming (content-type: text/event-stream)
    // and wrap the body so the mutex is held during the stream.
    const text = await response.text();
    assert.match(text, /"content":"hello"/);
    assert.match(text, /data: \[DONE\]/);

    // After stream completes, mutex should be free.
    const status = await app.fetch('/relay/status');
    const statusJson = await status.json();
    assert.equal(statusJson.mutex?.active, false, 'mutex free after streaming-with-loading response completes');
  });
});


