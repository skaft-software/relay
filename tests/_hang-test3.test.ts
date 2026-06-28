import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createApp } from '../src/server.ts';
import type { AppConfig } from '../src/config.ts';

type Handler = (req: IncomingMessage, res: ServerResponse, body: unknown) => void | Promise<void>;

async function withUpstream(run: (upstream: { url: string; handler: Handler }) => Promise<void>) {
  const upstream: { url: string; handler: Handler } = {
    url: '',
    handler: () => { throw new Error('upstream handler not set'); },
  };
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const text = Buffer.concat(chunks).toString('utf8');
    await upstream.handler(req, res, text ? JSON.parse(text) : undefined);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('unexpected server address');
  upstream.url = 'http://127.0.0.1:' + addr.port;
  try {
    await run(upstream);
  } finally {
    server.closeAllConnections();
    server.close();
    await once(server, 'close');
  }
}

function testConfig(url: string): AppConfig {
  return {
    port: 8080, host: '127.0.0.1', upstreamBaseUrl: url,
    samplingDefaults: {}, requestTimeoutMs: 1000, logLevel: 'silent',
    completionTtlMs: 3600000, maxRequestBodyBytes: 1048576,
    probeOnStartup: true, strictStartup: false, probeTimeoutMs: 3000,
    unknownFieldPolicy: 'pass_through', strictCompat: false,
    warnOnStrippedFields: true, modelProfile: 'generic',
    reasoningMode: 'off', toolMode: 'auto', observabilityEnabled: true,
    logPrompts: false, requestHistoryLimit: 100, maxStoreEntries: 1000,
    trustProxy: false, maxUpstreamResponseBytes: 16777216,
    modelStartTimeoutMs: 120000,
  };
}

test('streaming only', async () => {
  await withUpstream(async (upstream) => {
    upstream.handler = async (_req, res, body) => {
      if ((body as any)?.stream) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.end('data: [DONE]\n\n');
      } else {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ id: 'x', object: 'chat.completion', created: 1, model: 'llama', choices: [{ index: 0, message: { role: 'assistant', content: 'hi' }, finish_reason: 'stop' }] }));
      }
    };
    const app = createApp(testConfig(upstream.url));
    const stream = await app.fetch('/v1/chat/completions', {
      method: 'POST',
      body: { model: 'llama', stream: true, messages: [{ role: 'user', content: 'hi' }] },
    });
    const text = await stream.text();
    assert.match(text, /data: \[DONE\]/);
  });
});
