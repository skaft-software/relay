import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createApp } from '../src/server.ts';
import type { AppConfig } from '../src/config.ts';

test('foo', async () => {
  const upstream: any = { url: '', handler: null };
  const server = createServer(async (req, res) => {
    const chunks: any[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const text = Buffer.concat(chunks).toString('utf8');
    await upstream.handler(req, res, text ? JSON.parse(text) : undefined);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const addr = server.address();
  upstream.url = 'http://127.0.0.1:' + (addr && typeof addr === 'object' ? addr.port : 0);

  upstream.handler = async (_req: any, res: any, _body: any) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ id: 'x', object: 'chat.completion', created: 1, model: 'llama', choices: [{ index: 0, message: { role: 'assistant', content: 'hi' }, finish_reason: 'stop' }] }));
  };

  const app = createApp({
    port: 8080, host: '127.0.0.1', upstreamBaseUrl: upstream.url,
    samplingDefaults: {}, requestTimeoutMs: 1000, logLevel: 'silent',
    completionTtlMs: 3600000, maxRequestBodyBytes: 1048576,
    probeOnStartup: true, strictStartup: false, probeTimeoutMs: 3000,
    unknownFieldPolicy: 'pass_through', strictCompat: false,
    warnOnStrippedFields: true, modelProfile: 'generic',
    reasoningMode: 'off', toolMode: 'auto', observabilityEnabled: true,
    logPrompts: false, requestHistoryLimit: 100, maxStoreEntries: 1000,
    trustProxy: false, maxUpstreamResponseBytes: 16777216,
    modelStartTimeoutMs: 120000,
  });
  const res = await app.fetch('/health');
  assert.equal(res.status, 200);

  server.closeAllConnections();
  server.close();
  await once(server, 'close');
});
