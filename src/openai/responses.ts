import type { AppConfig } from '../config.ts';
import { GatewayError, invalidRequestError, jsonResponse, upstreamError } from '../errors.ts';
import { applyFieldPolicy, withFieldWarning } from '../field-policy.ts';
import { parseSSEJson, parseSSEStream, streamHeaders } from '../normalize/stream.ts';
import { upstreamFetch, upstreamHttpError, readLimitedText } from '../upstream/llama.ts';
import type { ModelLifecycle } from '../lifecycle.ts';
import { canonicalToUpstreamChatRequest } from '../internal/openai-chat.ts';
import { responseOutputToChatMessages, responsesRequestToCanonical } from '../internal/openai-responses.ts';
import { canonicalToOpenAIResponse, upstreamChatCompletionToCanonical } from '../internal/response.ts';
import { createLogger } from '../logger.ts';
import { logStreamingResponseDiagnostics, logUpstreamPayloadDiagnostics } from '../truncation-diagnostics.ts';

type JsonObject = Record<string, any>;

export class ResponseStore {
  private items = new Map<string, { response: JsonObject; chatMessages?: JsonObject[]; publicResponse: boolean; expiresAt: number }>();
  private maxEntries: number;
  private maxBytes: number | undefined;
  private totalBytes = 0;

  constructor(maxEntries = 1000, maxBytes?: number) {
    this.maxEntries = maxEntries;
    this.maxBytes = maxBytes;
  }

  save(response: JsonObject, ttlMs: number, chatMessages?: JsonObject[], publicResponse = true): void {
    this.prune();
    const entry = {
      response: structuredClone(response),
      chatMessages: chatMessages ? structuredClone(chatMessages) : undefined,
      publicResponse,
      expiresAt: Date.now() + ttlMs,
    };
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
    const entry = this.items.get(id);
    if (!entry?.publicResponse) return undefined;
    return structuredClone(entry.response);
  }

  has(id: string): boolean {
    this.prune();
    return this.items.has(id);
  }

  getChatMessages(id: string): JsonObject[] | undefined {
    this.prune();
    const entry = this.items.get(id);
    if (!entry?.chatMessages) return undefined;
    return structuredClone(entry.chatMessages);
  }

  delete(id: string): boolean {
    this.prune();
    const removed = this.items.get(id);
    if (removed) {
      this.totalBytes -= Buffer.byteLength(JSON.stringify(removed));
      if (this.totalBytes < 0) this.totalBytes = 0;
      this.items.delete(id);
      return removed.publicResponse;
    }
    return false;
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

export async function createResponse(config: AppConfig, store: ResponseStore, body: unknown, externalSignal?: AbortSignal, lifecycle?: ModelLifecycle): Promise<Response> {
  const logger = createLogger(config.logLevel);
  if (!isObject(body)) throw invalidRequestError('JSON body must be an object');
  const { body: normalized, strippedFields } = applyFieldPolicy('openai_responses', body, config);
  let previousMessages: JsonObject[] = [];
  if (typeof normalized.previous_response_id === 'string') {
    if (!store.has(normalized.previous_response_id)) {
      throw new GatewayError(404, `Response ${normalized.previous_response_id} was not found`);
    }
    previousMessages = store.getChatMessages(normalized.previous_response_id) ?? [];
  }
  // Resolve dynamic upstream URL when lifecycle provides per-model port routing.
  const upstreamBaseUrl = lifecycle && typeof normalized.model === 'string'
    ? lifecycle.getUpstreamUrl(normalized.model)
    : config.upstreamBaseUrl;

  const chatRequest = responseRequestToChat(normalized, config, previousMessages);
  logResponsesTranslation(logger, normalized, chatRequest, previousMessages);
  logUpstreamPayloadDiagnostics(logger, { route: '/v1/responses', upstream_route: '/v1/chat/completions', payload: chatRequest });
  if (normalized.stream === true) {
    return withFieldWarning(await streamResponse(config, store, normalized, chatRequest, upstreamBaseUrl, externalSignal), strippedFields, config);
  }

  const toolCount_ns = Array.isArray((chatRequest as any).tools) ? (chatRequest as any).tools.length : 0;
  logger.info("upstream non-stream call", { url: config.upstreamBaseUrl, model: (chatRequest as any).model, bodyKB: Math.round(JSON.stringify(chatRequest).length / 1024), tools: toolCount_ns });
  const upstreamRes = await upstreamFetch(config, '/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(chatRequest),
  }, externalSignal, upstreamBaseUrl);
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
  saveResponseContinuation(store, config, normalized, response, chatRequest);
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

function responseRequestToChat(input: JsonObject, config: AppConfig, previousMessages: JsonObject[] = []): JsonObject {
  const canonical = responsesRequestToCanonical(input, config, previousMessages);
  const chat = canonicalToUpstreamChatRequest(canonical);
  delete chat.previous_response_id;
  delete chat.store;
  return chat;
}

function chatCompletionToResponse(chat: unknown, request: JsonObject): JsonObject {
  const canonical = upstreamChatCompletionToCanonical(chat, request.model);
  return canonicalToOpenAIResponse(canonical, request);
}

function saveResponseContinuation(store: ResponseStore, config: AppConfig, request: JsonObject, response: JsonObject, chatRequest: JsonObject): void {
  const requestMessages = Array.isArray(chatRequest.messages) ? structuredClone(chatRequest.messages) : [];
  const responseMessages = responseOutputToChatMessages(response.output, config);
  store.save(response, config.completionTtlMs, [...requestMessages, ...responseMessages], request.store !== false);
}

function logResponsesTranslation(logger: ReturnType<typeof createLogger>, request: JsonObject, chatRequest: JsonObject, previousMessages: JsonObject[]): void {
  const messages = Array.isArray(chatRequest.messages) ? chatRequest.messages : [];
  const roleCounts: Record<string, number> = {};
  for (const message of messages) {
    if (!isObject(message)) continue;
    const role = typeof message.role === 'string' ? message.role : 'unknown';
    roleCounts[role] = (roleCounts[role] ?? 0) + 1;
  }
  logger.info("responses input translated", {
    model: chatRequest.model,
    previous_response_id: typeof request.previous_response_id === 'string' ? request.previous_response_id : undefined,
    previous_chat_messages: previousMessages.length,
    input_type: Array.isArray(request.input) ? 'array' : typeof request.input,
    input_items: Array.isArray(request.input) ? request.input.length : 1,
    input_item_types: responseInputItemTypes(request.input),
    chat_messages: messages.length,
    chat_roles: roleCounts,
    tools: Array.isArray(chatRequest.tools) ? chatRequest.tools.length : 0,
    tool_choice: chatRequest.tool_choice,
  });
}

function responseInputItemTypes(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined;
  return input.map((item) => {
    if (!isObject(item)) return typeof item;
    if (typeof item.type === 'string') return item.type;
    if (typeof item.role === 'string') return `message:${item.role}`;
    return 'object';
  });
}

type StreamToolCallState = {
  upstreamIndex: number;
  outputIndex: number;
  itemId: string;
  callId: string;
  name?: string;
  arguments: string;
  emittedArgumentBytes: number;
  started: boolean;
};

async function streamResponse(config: AppConfig, store: ResponseStore, request: JsonObject, chatRequest: JsonObject, upstreamBaseUrl?: string, externalSignal?: AbortSignal): Promise<Response> {
  const logger = createLogger(config.logLevel);
  const toolCount_stream = Array.isArray((chatRequest as any).tools) ? (chatRequest as any).tools.length : 0;
  logger.info("upstream stream call", { url: upstreamBaseUrl ?? config.upstreamBaseUrl, model: (chatRequest as any).model, bodyKB: Math.round(JSON.stringify(chatRequest).length / 1024), tools: toolCount_stream });
  const upstream = await upstreamFetch(config, '/v1/chat/completions', {
    method: 'POST',
    headers: {
      accept: 'text/event-stream',
      'content-type': 'application/json',
    },
    body: JSON.stringify(chatRequest),
  }, externalSignal, upstreamBaseUrl);
  if (!upstream.response.ok || !upstream.response.body) {
    throw upstream.response.body ? await upstreamHttpError(upstream.response, config) : upstreamError('bad_response', 'Upstream returned an empty stream');
  }

  const responseId = `resp_${crypto.randomUUID()}`;
  const createdAt = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  let upstreamEvents = 0;
  let downstreamEvents = 0;
  let upstreamBytes = 0;
  let downstreamBytes = 0;
  let sawDone = false;
  let endedCleanly = false;
  let textChars = 0;
  let reasoningChars = 0;
  let finishReason: unknown;
  const output: JsonObject[] = [];
  const toolCalls = new Map<number, StreamToolCallState>();
  const enqueue = (controller: ReadableStreamDefaultController<Uint8Array>, chunk: string) => {
    downstreamEvents += 1;
    downstreamBytes += Buffer.byteLength(chunk);
    controller.enqueue(encoder.encode(chunk));
  };
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const itemId = `msg_${crypto.randomUUID()}`;
      let nextOutputIndex = 0;
      let messageOutputIndex = -1;
      let messageStarted = false;
      let messageText = '';
      let reasoningBuffer = '';
      const ensureMessageStarted = () => {
        if (messageStarted) return;
        messageStarted = true;
        messageOutputIndex = nextOutputIndex++;
        output.push({
          id: itemId,
          type: 'message',
          status: 'in_progress',
          role: 'assistant',
          content: [{ type: 'output_text', text: '', annotations: [] }],
        });
        enqueue(controller, sse('response.output_item.added', {
          type: 'response.output_item.added',
          output_index: messageOutputIndex,
          item: {
            id: itemId,
            type: 'message',
            status: 'in_progress',
            role: 'assistant',
            content: [],
          },
        }));
        enqueue(controller, sse('response.content_part.added', {
          type: 'response.content_part.added',
          item_id: itemId,
          output_index: messageOutputIndex,
          content_index: 0,
          part: { type: 'output_text', text: '', annotations: [] },
        }));
      };
      const appendText = (text: string) => {
        ensureMessageStarted();
        messageText += text;
        textChars += text.length;
        const message = output[messageOutputIndex];
        if (message && Array.isArray(message.content) && isObject(message.content[0])) {
          message.content[0].text = messageText;
        }
        enqueue(controller, sse('response.output_text.delta', {
          type: 'response.output_text.delta',
          item_id: itemId,
          output_index: messageOutputIndex,
          content_index: 0,
          delta: text,
        }));
      };
      const finishMessage = () => {
        if (!messageStarted) return;
        const item = {
          id: itemId,
          type: 'message',
          status: 'completed',
          role: 'assistant',
          content: [{ type: 'output_text', text: messageText, annotations: [] }],
        };
        output[messageOutputIndex] = item;
        enqueue(controller, sse('response.content_part.done', {
          type: 'response.content_part.done',
          item_id: itemId,
          output_index: messageOutputIndex,
          content_index: 0,
          part: { type: 'output_text', text: messageText, annotations: [] },
        }));
        enqueue(controller, sse('response.output_item.done', {
          type: 'response.output_item.done',
          output_index: messageOutputIndex,
          item,
        }));
      };
      const ensureToolCallStarted = (state: StreamToolCallState) => {
        if (state.started) return;
        if (!state.name) return;
        state.started = true;
        state.outputIndex = nextOutputIndex++;
        const item = {
          id: state.itemId,
          type: 'function_call',
          call_id: state.callId,
          name: state.name,
          arguments: '',
          status: 'in_progress',
        };
        output[state.outputIndex] = item;
        enqueue(controller, sse('response.output_item.added', {
          type: 'response.output_item.added',
          output_index: state.outputIndex,
          item,
        }));
      };
      const emitPendingToolArguments = (state: StreamToolCallState) => {
        if (!state.started) return;
        const delta = state.arguments.slice(state.emittedArgumentBytes);
        if (delta.length === 0) return;
        state.emittedArgumentBytes = state.arguments.length;
        enqueue(controller, sse('response.function_call_arguments.delta', {
          type: 'response.function_call_arguments.delta',
          item_id: state.itemId,
          output_index: state.outputIndex,
          delta,
        }));
      };
      const handleToolCallDelta = (toolCall: unknown) => {
        if (!isObject(toolCall)) return;
        const upstreamIndex = typeof toolCall.index === 'number' ? toolCall.index : toolCalls.size;
        let state = toolCalls.get(upstreamIndex);
        if (!state) {
          state = {
            upstreamIndex,
            outputIndex: -1,
            itemId: `fc_${crypto.randomUUID()}`,
            callId: `call_${crypto.randomUUID()}`,
            arguments: '',
            emittedArgumentBytes: 0,
            started: false,
          };
          toolCalls.set(upstreamIndex, state);
        }
        if (typeof toolCall.id === 'string' && toolCall.id.length > 0) state.callId = toolCall.id;
        if (typeof toolCall.call_id === 'string' && toolCall.call_id.length > 0) state.callId = toolCall.call_id;
        if (typeof toolCall.id === 'string' && toolCall.id.startsWith('fc_')) state.itemId = toolCall.id;
        const fn = isObject(toolCall.function) ? toolCall.function : {};
        if (typeof fn.name === 'string' && fn.name.length > 0) state.name = fn.name;
        if (typeof fn.arguments === 'string') state.arguments += fn.arguments;
        ensureToolCallStarted(state);
        emitPendingToolArguments(state);
      };
      const finishToolCalls = () => {
        for (const state of [...toolCalls.values()].sort((a, b) => a.upstreamIndex - b.upstreamIndex)) {
          ensureToolCallStarted(state);
          if (!state.started || !state.name) {
            throw upstreamError('bad_response', 'Upstream tool call was missing a function name');
          }
          emitPendingToolArguments(state);
          const args = state.arguments.length > 0 ? state.arguments : '{}';
          const item = {
            id: state.itemId,
            type: 'function_call',
            call_id: state.callId,
            name: state.name,
            arguments: args,
            status: 'completed',
          };
          output[state.outputIndex] = item;
          enqueue(controller, sse('response.function_call_arguments.done', {
            type: 'response.function_call_arguments.done',
            item_id: state.itemId,
            output_index: state.outputIndex,
            arguments: args,
          }));
          enqueue(controller, sse('response.output_item.done', {
            type: 'response.output_item.done',
            output_index: state.outputIndex,
            item,
          }));
        }
      };
      enqueue(controller, sse('response.created', {
        type: 'response.created',
        response: {
          id: responseId,
          object: 'response',
          created_at: createdAt,
          model: chatRequest.model,
          status: 'in_progress',
          output: [],
        },
      }));
      enqueue(controller, sse('response.in_progress', {
        type: 'response.in_progress',
        response: { id: responseId, object: 'response', status: 'in_progress' },
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
          finishReason = chunk.choices?.[0]?.finish_reason ?? finishReason;
          if (typeof delta?.reasoning_content === 'string' && delta.reasoning_content.length > 0) {
            reasoningBuffer += delta.reasoning_content;
            reasoningChars += delta.reasoning_content.length;
          }
          if (Array.isArray(delta?.tool_calls)) {
            for (const toolCall of delta.tool_calls) handleToolCallDelta(toolCall);
          }
          if (typeof delta?.content === 'string' && delta.content.length > 0) {
            appendText(delta.content);
          }
        }
        if (!messageStarted && output.length === 0 && toolCalls.size === 0 && reasoningBuffer.length > 0) {
          appendText(reasoningBuffer);
        }
        finishMessage();
        finishToolCalls();
        endedCleanly = true;
      } catch (error) {
        failed = true;
        const errMsg = error instanceof Error ? error.message : String(error);
        logger.error("sse stream failed", { error: errMsg, stack: error instanceof Error ? error.stack : undefined });
        enqueue(controller, sse('response.failed', {
          type: 'response.failed',
          response: { id: responseId, object: 'response', status: 'failed' },
          error: { message: errMsg },
        }));
      }
      if (!failed) {
        const completedResponse = {
          id: responseId,
          object: 'response',
          created_at: createdAt,
          model: chatRequest.model,
          status: 'completed',
          output,
          previous_response_id: typeof request.previous_response_id === 'string' ? request.previous_response_id : undefined,
        };
        saveResponseContinuation(store, config, request, completedResponse, chatRequest);
        enqueue(controller, sse('response.completed', {
          type: 'response.completed',
          response: completedResponse,
        }));
      }
      logger.info("responses stream translated", {
        model: chatRequest.model,
        text_chars: textChars,
        reasoning_chars: reasoningChars,
        tool_calls: toolCalls.size,
        finish_reason: finishReason,
      });
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
