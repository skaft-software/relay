import type { AppConfig } from '../config.ts';
import { GatewayError, invalidRequestError, jsonResponse, unsupportedCapabilityError, upstreamError } from '../errors.ts';
import { applyFieldPolicy, withFieldWarning } from '../field-policy.ts';
import { parseSSEJson, parseSSEStream, streamHeaders } from '../normalize/stream.ts';
import { upstreamFetch, upstreamHttpError, readLimitedText } from '../upstream/llama.ts';
import { canonicalToUpstreamChatRequest } from '../internal/openai-chat.ts';
import { responsesRequestToCanonical } from '../internal/openai-responses.ts';
import { canonicalToOpenAIResponse, upstreamChatCompletionToCanonical } from '../internal/response.ts';
import { createLogger } from '../logger.ts';
import { logStreamingResponseDiagnostics, logUpstreamPayloadDiagnostics } from '../truncation-diagnostics.ts';

type JsonObject = Record<string, any>;

export class ResponseStore {
  private items = new Map<string, { response: JsonObject; expiresAt: number }>();
  private maxEntries: number;
  private maxBytes: number | undefined;
  private totalBytes = 0;

  constructor(maxEntries = 1000, maxBytes?: number) {
    this.maxEntries = maxEntries;
    this.maxBytes = maxBytes;
  }

  save(response: JsonObject, ttlMs: number): void {
    this.prune();
    const entry = { response: structuredClone(response), expiresAt: Date.now() + ttlMs };
    const entryBytes = Buffer.byteLength(JSON.stringify(entry));

    // Count-based enforcement.
    if (this.items.size >= this.maxEntries) {
      let oldestId: string | undefined;
      let oldestTime = Infinity;
      for (const [id, existing] of this.items) {
        if (existing.expiresAt < oldestTime) {
          oldestTime = existing.expiresAt;
          oldestId = id;
        }
      }
      if (oldestId) {
        const removed = this.items.get(oldestId);
        if (removed) this.totalBytes -= Buffer.byteLength(JSON.stringify(removed));
        this.items.delete(oldestId);
      }
    }

    // Byte-cap enforcement.
    if (this.maxBytes !== undefined) {
      while (this.totalBytes + entryBytes > this.maxBytes && this.items.size > 0) {
        let oldestId: string | undefined;
        let oldestTime = Infinity;
        for (const [id, existing] of this.items) {
          if (existing.expiresAt < oldestTime) {
            oldestTime = existing.expiresAt;
            oldestId = id;
          }
        }
        if (oldestId) {
          const removed = this.items.get(oldestId);
          if (removed) this.totalBytes -= Buffer.byteLength(JSON.stringify(removed));
          this.items.delete(oldestId);
        } else break;
      }
    }

    this.totalBytes += entryBytes;
    this.items.set(response.id, entry);
  }

  get(id: string): JsonObject | undefined {
    this.prune();
    return structuredClone(this.items.get(id)?.response);
  }

  delete(id: string): boolean {
    this.prune();
    const removed = this.items.get(id);
    if (removed) {
      this.totalBytes -= Buffer.byteLength(JSON.stringify(removed));
      if (this.totalBytes < 0) this.totalBytes = 0;
    }
    return this.items.delete(id);
  }

  private prune() {
    const now = Date.now();
    for (const [id, entry] of this.items) {
      if (entry.expiresAt <= now) {
        this.totalBytes -= Buffer.byteLength(JSON.stringify(entry));
        if (this.totalBytes < 0) this.totalBytes = 0;
        this.items.delete(id);
      }
    }
  }
}

export async function createResponse(config: AppConfig, store: ResponseStore, body: unknown, externalSignal?: AbortSignal): Promise<Response> {
  const logger = createLogger(config.logLevel);
  if (!isObject(body)) throw invalidRequestError('JSON body must be an object');
  const { body: normalized, strippedFields } = applyFieldPolicy('openai_responses', body, config);
  if (typeof normalized.previous_response_id === 'string' && !store.get(normalized.previous_response_id)) {
    throw new GatewayError(404, `Response ${normalized.previous_response_id} was not found`);
  }
  const chatRequest = responseRequestToChat(normalized, config);
  logUpstreamPayloadDiagnostics(logger, { route: '/v1/responses', upstream_route: '/v1/chat/completions', payload: chatRequest });
  if (normalized.stream === true) return withFieldWarning(await streamResponse(config, chatRequest, externalSignal), strippedFields, config);

  const upstreamRes = await upstreamFetch(config, '/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(chatRequest),
  }, externalSignal);
  if (!upstreamRes.response.ok) throw await upstreamHttpError(upstreamRes.response, config);
  const upstreamText = await readLimitedText(upstreamRes.response, config.maxUpstreamResponseBytes);
  const upstreamBytes = Buffer.byteLength(upstreamText);
  let chat: unknown;
  try {
    chat = JSON.parse(upstreamText);
  } catch {
    throw upstreamError('bad_response', 'Upstream returned invalid JSON');
  }
  const response = chatCompletionToResponse(chat, normalized);
  if (normalized.store !== false) {
    store.save(response, config.completionTtlMs);
  }
  const out = withFieldWarning(jsonResponse(response), strippedFields, config);
  out.headers.set('x-relay-internal-upstream-bytes', String(upstreamBytes));
  return out;
}

export function getResponse(store: ResponseStore, id: string): Response {
  const response = store.get(id);
  if (!response) throw new GatewayError(404, `Response ${id} was not found`);
  return jsonResponse(response);
}

export function deleteResponse(store: ResponseStore, id: string): Response {
  if (!store.delete(id)) throw new GatewayError(404, `Response ${id} was not found`);
  return jsonResponse({ id, object: 'response.deleted', deleted: true });
}

function responseRequestToChat(input: JsonObject, config: AppConfig): JsonObject {
  const canonical = responsesRequestToCanonical(input, config);
  const chat = canonicalToUpstreamChatRequest(canonical);
  delete chat.previous_response_id;
  delete chat.store;
  return chat;
}

function chatCompletionToResponse(chat: unknown, request: JsonObject): JsonObject {
  const canonical = upstreamChatCompletionToCanonical(chat, request.model);
  return canonicalToOpenAIResponse(canonical, request);
}

async function streamResponse(config: AppConfig, chatRequest: JsonObject, externalSignal?: AbortSignal): Promise<Response> {
  const logger = createLogger(config.logLevel);
  const upstream = await upstreamFetch(config, '/v1/chat/completions', {
    method: 'POST',
    headers: {
      accept: 'text/event-stream',
      'content-type': 'application/json',
    },
    body: JSON.stringify(chatRequest),
  }, externalSignal);
  if (!upstream.response.ok || !upstream.response.body) {
    throw upstream.response.body ? await upstreamHttpError(upstream.response, config) : upstreamError('bad_response', 'Upstream returned an empty stream');
  }

  const responseId = `resp_${crypto.randomUUID()}`;
  const encoder = new TextEncoder();
  let upstreamEvents = 0;
  let downstreamEvents = 0;
  let upstreamBytes = 0;
  let downstreamBytes = 0;
  let sawDone = false;
  let endedCleanly = false;
  const enqueue = (controller: ReadableStreamDefaultController<Uint8Array>, chunk: string) => {
    downstreamEvents += 1;
    downstreamBytes += Buffer.byteLength(chunk);
    controller.enqueue(encoder.encode(chunk));
  };
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      enqueue(controller, sse('response.created', {
        type: 'response.created',
        response: {
          id: responseId,
          object: 'response',
          created_at: Math.floor(Date.now() / 1000),
          model: chatRequest.model,
          status: 'in_progress',
          output: [],
        },
      }));
      let failed = false;
      try {
        for await (const frame of parseSSEStream(upstream.response.body!)) {
          upstreamEvents += 1;
          upstreamBytes += Buffer.byteLength(frame.data) + (frame.event ? Buffer.byteLength(frame.event) : 0);
          if (frame.data === '[DONE]') sawDone = true;
          if (frame.data === '[DONE]') break;
          const chunk = parseSSEJson(frame);
          const delta = chunk.choices?.[0]?.delta;
          if (typeof delta?.content === 'string') {
            enqueue(controller, sse('response.output_text.delta', {
              type: 'response.output_text.delta',
              item_id: responseId,
              output_index: 0,
              content_index: 0,
              delta: delta.content,
            }));
          }
        }
        endedCleanly = true;
      } catch (error) {
        failed = true;
        enqueue(controller, sse('response.failed', {
          type: 'response.failed',
          response: { id: responseId, object: 'response', status: 'failed' },
          error: { message: error instanceof Error ? error.message : 'Upstream stream failed' },
        }));
      }
      if (!failed) {
        enqueue(controller, sse('response.completed', {
          type: 'response.completed',
          response: { id: responseId, object: 'response', status: 'completed' },
        }));
      }
      logStreamingResponseDiagnostics(logger, {
        route: '/v1/responses',
        upstream_sse_events_received: upstreamEvents,
        downstream_sse_events_emitted: downstreamEvents,
        upstream_bytes_received: upstreamBytes,
        downstream_bytes_emitted: downstreamBytes,
        final_done_marker_observed: sawDone,
        upstream_ended_cleanly: endedCleanly,
      });
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: streamHeaders() });
}

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
