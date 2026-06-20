/**
 * Tests for /v1/responses streaming SSE event lifecycle.
 *
 * Covers:
 *  - Text-only delta stream → proper output_item / content_part / text_delta / completed lifecycle
 *  - Tool-call delta stream with incremental arguments
 *  - Reasoning-only stream (DeepSeek) → reasoning_content buffered as text fallback
 *  - Mixed stream (text + tool calls interleaved)
 *  - Stream failure → response.failed event
 *  - Empty stream (no content, no tools, no reasoning) → graceful completion
 *  - Response continuation store (previous_response_id round-trip)
 */

import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import test from 'node:test';

import type { AppConfig } from '../src/config.ts';
import { createApp } from '../src/server.ts';

// ── SSE parsing helpers ──────────────────────────────────────────────────

interface SSEEvent {
  event?: string;
  data: unknown;
}

/** Parse a raw SSE body text into structured events. */
function parseSSEBody(text: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const blocks = text.split('\n\n');
  for (const block of blocks) {
    if (!block.trim()) continue;
    let event: string | undefined;
    let data: string | undefined;
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) event = line.slice(7).trim();
      else if (line.startsWith('data: ')) data = line.slice(6);
    }
    if (data !== undefined) {
      try {
        events.push({ event, data: JSON.parse(data) });
      } catch {
        events.push({ event, data });
      }
    }
  }
  return events;
}

/** Find SSE events matching a given type string. */
function findEvents(events: SSEEvent[], type: string): SSEEvent[] {
  return events.filter((e) => {
    const d = e.data as Record<string, unknown> | null;
    return d && typeof d === 'object' && d.type === type;
  });
}

/** Get event type names in order. */
function eventTypes(events: SSEEvent[]): string[] {
  return events.map((e) => {
    const d = e.data as Record<string, unknown> | null;
    return (d && typeof d === 'object' && typeof d.type === 'string') ? d.type : (e.event ?? 'unknown');
  });
}

// ── Test config / helpers ────────────────────────────────────────────────

function testConfig(upstreamBaseUrl: string): AppConfig {
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
  };
}

function sseChunk(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function sseDone(): string {
  return 'data: [DONE]\n\n';
}

function chatChunk(model: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'chatcmpl-1',
    object: 'chat.completion.chunk',
    created: 1,
    model,
    choices: [{ index: 0, delta: {}, finish_reason: null, ...overrides }],
  };
}

function deltaContent(content: string): Record<string, unknown> {
  return { delta: { content } };
}

function deltaToolCalls(toolCalls: unknown[]): Record<string, unknown> {
  return { delta: { tool_calls: toolCalls } };
}

function deltaReasoning(reasoning: string): Record<string, unknown> {
  return { delta: { reasoning_content: reasoning } };
}

function finishReason(reason: string): Record<string, unknown> {
  return { finish_reason: reason };
}

type UpstreamHandler = (req: IncomingMessage, res: ServerResponse, body: unknown) => void | Promise<void>;

async function withUpstream(
  run: (upstream: { url: string; handler: UpstreamHandler }) => Promise<void>,
): Promise<void> {
  const upstream = {
    url: '',
    handler: (_req: IncomingMessage, _res: ServerResponse, _body: unknown) => {
      throw new Error('upstream handler not set');
    },
  };
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const text = Buffer.concat(chunks).toString('utf8');
    await upstream.handler(req, res, text ? JSON.parse(text) : undefined);
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

// ── Streaming SSE lifecycle tests ────────────────────────────────────────

test('streaming: text-only delta stream emits full output_text lifecycle', async () => {
  await withUpstream(async (upstream) => {
    upstream.handler = (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(sseChunk(chatChunk('llama', deltaContent('Hello'))));
      res.write(sseChunk(chatChunk('llama', { ...deltaContent(' World'), ...finishReason('stop') })));
      res.end(sseDone());
    };
    const app = createApp(testConfig(upstream.url));
    const res = await app.fetch('/v1/responses', {
      method: 'POST',
      body: { model: 'llama', input: 'hi', stream: true },
    });

    assert.equal(res.status, 200);
    const text = await res.text();
    const events = parseSSEBody(text);
    const types = eventTypes(events);

    assert.ok(types.includes('response.created'), 'should have response.created');
    assert.ok(types.includes('response.in_progress'), 'should have response.in_progress');
    assert.ok(types.includes('response.output_item.added'), 'should have output_item.added');
    assert.ok(types.includes('response.content_part.added'), 'should have content_part.added');
    assert.ok(types.includes('response.output_text.delta'), 'should have output_text.delta');
    assert.ok(types.includes('response.content_part.done'), 'should have content_part.done');
    assert.ok(types.includes('response.output_item.done'), 'should have output_item.done');
    assert.ok(types.includes('response.completed'), 'should have response.completed');

    const completed = findEvents(events, 'response.completed')[0];
    const resp = (completed.data as Record<string, unknown>).response as Record<string, unknown>;
    const output = resp.output as Array<Record<string, unknown>>;
    const msg = output.find((o) => o.type === 'message');
    assert.ok(msg, 'should have a message output item');
    const content = msg.content as Array<Record<string, unknown>>;
    assert.equal(content[0].text, 'Hello World');
  });
});

test('streaming: tool-call delta stream emits function_call items with incremental arguments', async () => {
  await withUpstream(async (upstream) => {
    upstream.handler = (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(sseChunk(chatChunk('llama', deltaToolCalls([{
        index: 0, id: 'call_abc123', type: 'function',
        function: { name: 'get_weather', arguments: '{"city"' },
      }]))));
      res.write(sseChunk(chatChunk('llama', deltaToolCalls([{
        index: 0, function: { arguments: ':"NYC"' },
      }]))));
      res.write(sseChunk(chatChunk('llama', {
        ...deltaToolCalls([{ index: 0, function: { arguments: '}' } }]),
        ...finishReason('tool_calls'),
      })));
      res.end(sseDone());
    };
    const app = createApp(testConfig(upstream.url));
    const res = await app.fetch('/v1/responses', {
      method: 'POST',
      body: { model: 'llama', input: 'weather?', stream: true },
    });

    assert.equal(res.status, 200);
    const text = await res.text();
    const events = parseSSEBody(text);
    const types = eventTypes(events);

    assert.ok(types.includes('response.output_item.added'));
    assert.ok(types.includes('response.function_call_arguments.delta'));
    assert.ok(types.includes('response.function_call_arguments.done'));
    assert.ok(types.includes('response.output_item.done'));
    assert.ok(types.includes('response.completed'));

    const completed = findEvents(events, 'response.completed')[0];
    const resp = (completed.data as Record<string, unknown>).response as Record<string, unknown>;
    const output = resp.output as Array<Record<string, unknown>>;
    const fc = output.find((o) => o.type === 'function_call') as Record<string, unknown>;
    assert.ok(fc, 'should have a function_call output item');
    assert.equal(fc.name, 'get_weather');
    assert.equal(fc.call_id, 'call_abc123');
    assert.equal(fc.status, 'completed');
    assert.equal(fc.arguments, '{"city":"NYC"}');
  });
});

test('streaming: reasoning-only stream uses reasoning_content as text fallback', async () => {
  await withUpstream(async (upstream) => {
    upstream.handler = (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(sseChunk(chatChunk('deepseek', deltaReasoning('Let me think about this...'))));
      res.write(sseChunk(chatChunk('deepseek', {
        ...deltaReasoning(' The answer is 42.'),
        ...finishReason('stop'),
      })));
      res.end(sseDone());
    };
    const app = createApp(testConfig(upstream.url));
    const res = await app.fetch('/v1/responses', {
      method: 'POST',
      body: { model: 'deepseek', input: 'what is the answer?', stream: true },
    });

    assert.equal(res.status, 200);
    const text = await res.text();
    const events = parseSSEBody(text);
    const completed = findEvents(events, 'response.completed')[0];
    const resp = (completed.data as Record<string, unknown>).response as Record<string, unknown>;
    const output = resp.output as Array<Record<string, unknown>>;
    const msg = output.find((o) => o.type === 'message');
    assert.ok(msg, 'should have a message output item');
    const content = msg.content as Array<Record<string, unknown>>;
    assert.equal(content[0].text, 'Let me think about this... The answer is 42.');
  });
});

test('streaming: mixed text + tool calls interleaved', async () => {
  await withUpstream(async (upstream) => {
    upstream.handler = (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(sseChunk(chatChunk('llama', deltaContent('Let me check'))));
      res.write(sseChunk(chatChunk('llama', deltaToolCalls([{
        index: 0, id: 'call_x', type: 'function',
        function: { name: 'search', arguments: '{"q":"test"}' },
      }]))));
      res.write(sseChunk(chatChunk('llama', deltaContent(' the weather...'))));
      res.write(sseChunk(chatChunk('llama', finishReason('stop'))));
      res.end(sseDone());
    };
    const app = createApp(testConfig(upstream.url));
    const res = await app.fetch('/v1/responses', {
      method: 'POST',
      body: { model: 'llama', input: 'search weather', stream: true },
    });

    assert.equal(res.status, 200);
    const text = await res.text();
    const events = parseSSEBody(text);
    const completed = findEvents(events, 'response.completed')[0];
    const resp = (completed.data as Record<string, unknown>).response as Record<string, unknown>;
    const output = resp.output as Array<Record<string, unknown>>;
    const hasMessage = output.some((o) => o.type === 'message');
    const hasFunctionCall = output.some((o) => o.type === 'function_call');
    assert.ok(hasMessage, 'should have a message output');
    assert.ok(hasFunctionCall, 'should have a function_call output');
  });
});

test('streaming: upstream stream failure emits response.failed', async () => {
  await withUpstream(async (upstream) => {
    upstream.handler = (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(sseChunk(chatChunk('llama', deltaContent('partial...'))));
      // Send invalid SSE JSON mid-stream — parseSSEJson will throw upstreamError
      res.write('data: not-valid-json\n\n');
      res.end();
    };
    const app = createApp(testConfig(upstream.url));
    const res = await app.fetch('/v1/responses', {
      method: 'POST',
      body: { model: 'llama', input: 'hi', stream: true },
    });

    const text = await res.text();
    const events = parseSSEBody(text);
    const types = eventTypes(events);

    assert.ok(types.includes('response.failed'), 'should emit response.failed');
    const failedIdx = types.indexOf('response.failed');
    const createdIdx = types.indexOf('response.created');
    assert.ok(failedIdx > createdIdx, 'response.failed should come after response.created');
  });
});

test('streaming: empty stream (no content, no tools, no reasoning) completes gracefully', async () => {
  await withUpstream(async (upstream) => {
    upstream.handler = (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(sseChunk(chatChunk('llama', { delta: {} })));
      res.write(sseChunk(chatChunk('llama', { ...finishReason('stop'), delta: {} })));
      res.end(sseDone());
    };
    const app = createApp(testConfig(upstream.url));
    const res = await app.fetch('/v1/responses', {
      method: 'POST',
      body: { model: 'llama', input: 'hi', stream: true },
    });

    assert.equal(res.status, 200);
    const text = await res.text();
    const events = parseSSEBody(text);
    const types = eventTypes(events);

    assert.ok(types.includes('response.created'));
    assert.ok(types.includes('response.completed'));
    assert.ok(!types.includes('response.failed'));
  });
});

test('streaming: completed response stores chat messages for previous_response_id continuation', async () => {
  await withUpstream(async (upstream) => {
    let secondBody: unknown;

    upstream.handler = async (_req, res, body) => {
      if (!secondBody) {
        // First turn
        secondBody = undefined; // will be set on second call
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.write(sseChunk(chatChunk('llama', deltaContent('Hello from first turn'))));
        res.write(sseChunk(chatChunk('llama', finishReason('stop'))));
        res.end(sseDone());
        return;
      }
      // This is the second call — capture body for assertions
      // (reset handler so third call goes here)
    };

    // Override: use a flag to distinguish turns
    let turn = 0;
    upstream.handler = (_req, res, body) => {
      turn++;
      if (turn === 1) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.write(sseChunk(chatChunk('llama', deltaContent('Hello from first turn'))));
        res.write(sseChunk(chatChunk('llama', finishReason('stop'))));
        res.end(sseDone());
      } else {
        secondBody = body;
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.write(sseChunk(chatChunk('llama', deltaContent('Second turn response'))));
        res.write(sseChunk(chatChunk('llama', finishReason('stop'))));
        res.end(sseDone());
      }
    };

    const app = createApp(testConfig(upstream.url));

    const res1 = await app.fetch('/v1/responses', {
      method: 'POST',
      body: { model: 'llama', input: 'first message', stream: true, store: true },
    });
    const text1 = await res1.text();
    const events1 = parseSSEBody(text1);
    const completed1 = findEvents(events1, 'response.completed')[0];
    const resp1 = (completed1.data as Record<string, unknown>).response as Record<string, unknown>;
    const responseId = resp1.id as string;
    assert.ok(responseId, 'should have a response id');

    const res2 = await app.fetch('/v1/responses', {
      method: 'POST',
      body: { model: 'llama', input: 'follow up', stream: true, previous_response_id: responseId },
    });
    const text2 = await res2.text();
    const events2 = parseSSEBody(text2);
    const completed2 = findEvents(events2, 'response.completed')[0];
    assert.ok(completed2, 'second response should complete');

    assert.ok(secondBody, 'second request should have been sent to upstream');
    const sb = secondBody as Record<string, unknown>;
    const msgs = sb.messages as Array<Record<string, unknown>>;
    assert.ok(Array.isArray(msgs), 'should have messages array');
    const hasUser1 = msgs.some((m) => m.role === 'user' && m.content === 'first message');
    const hasAssistant = msgs.some((m) => m.role === 'assistant');
    const hasUser2 = msgs.some((m) => m.role === 'user' && m.content === 'follow up');
    assert.ok(hasUser1, 'should include first user message');
    assert.ok(hasAssistant, 'should include assistant response from first turn');
    assert.ok(hasUser2, 'should include follow-up message');
  });
});

test('streaming: response.created contains model, status, and output array', async () => {
  await withUpstream(async (upstream) => {
    upstream.handler = (_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(sseChunk(chatChunk('gemma-3b', deltaContent('ok'))));
      res.write(sseChunk(chatChunk('gemma-3b', finishReason('stop'))));
      res.end(sseDone());
    };
    const app = createApp(testConfig(upstream.url));
    const res = await app.fetch('/v1/responses', {
      method: 'POST',
      body: { model: 'gemma-3b', input: 'test', stream: true },
    });

    const text = await res.text();
    const events = parseSSEBody(text);
    const created = findEvents(events, 'response.created')[0];
    const resp = (created.data as Record<string, unknown>).response as Record<string, unknown>;

    assert.ok(resp.id, 'should have an id');
    assert.ok((resp.id as string).startsWith('resp_'), 'id should start with resp_');
    assert.equal(resp.object, 'response');
    assert.equal(resp.model, 'gemma-3b');
    assert.equal(resp.status, 'in_progress');
    assert.deepEqual(resp.output, []);
  });
});

test('streaming: response.completed echoes previous_response_id', async () => {
  await withUpstream(async (upstream) => {
    let turn = 0;
    upstream.handler = (_req, res) => {
      turn++;
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(sseChunk(chatChunk('llama', deltaContent(`turn ${turn}`))));
      res.write(sseChunk(chatChunk('llama', finishReason('stop'))));
      res.end(sseDone());
    };

    const app = createApp(testConfig(upstream.url));

    const r1 = await app.fetch('/v1/responses', {
      method: 'POST', body: { model: 'llama', input: 'msg1', stream: true, store: true },
    });
    const e1 = parseSSEBody(await r1.text());
    const prevId = ((findEvents(e1, 'response.completed')[0].data as Record<string, unknown>).response as Record<string, unknown>).id as string;

    const r2 = await app.fetch('/v1/responses', {
      method: 'POST', body: { model: 'llama', input: 'msg2', stream: true, previous_response_id: prevId },
    });
    const e2 = parseSSEBody(await r2.text());
    const completed2 = (findEvents(e2, 'response.completed')[0].data as Record<string, unknown>).response as Record<string, unknown>;

    assert.equal(completed2.previous_response_id, prevId);
  });
});

// ── Cold-start lifecycle event tests ─────────────────────────────────────

// Note: cold-start lifecycle events (relay.loading, relay.loaded, relay.error)
// require the model lifecycle to spawn real OS processes. These are tested via
// integration tests (model-switch.test.ts covers the lifecycle plumbing;
// encodeLifecycleFrame shape tests would need a mock spawn hook).
