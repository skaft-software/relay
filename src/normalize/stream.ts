import { upstreamError } from '../errors.ts';

export function streamHeaders(): HeadersInit {
  return {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  };
}

export type SSEFrame = {
  event?: string;
  data: unknown;
};

export type ParsedSSEFrame = {
  event?: string;
  data: string;
};

export type StreamDiagnosticsHooks = {
  onUpstreamFrame?: (frame: ParsedSSEFrame) => void;
  onDownstreamChunk?: (chunk: string) => void;
  onUpstreamComplete?: (clean: boolean) => void;
};

export function encodeSSE(frame: SSEFrame): string {
  const data = typeof frame.data === 'string' ? frame.data : JSON.stringify(frame.data);
  return `${frame.event ? `event: ${frame.event}\n` : ''}data: ${data}\n\n`;
}

export function ensureOpenAIStreamDone(body: ReadableStream<Uint8Array>, includeUsage = false, hooks?: StreamDiagnosticsHooks): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const abortController = new AbortController();
  let cancelled = false;
  let iterator: AsyncGenerator<ParsedSSEFrame> | undefined;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let sawDone = false;
      let sawUsageOnlyChunk = false;
      let latestUsage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
      let streamId: string | undefined;
      let streamModel: string | undefined;
      let streamCreated: number | undefined;
      try {
        iterator = parseSSEStream(body, undefined, abortController.signal);
        for await (const frame of iterator) {
          if (cancelled) return;
          hooks?.onUpstreamFrame?.(frame);
          if (frame.data === '[DONE]') {
            if (includeUsage && latestUsage && !sawUsageOnlyChunk) {
              const usageChunk = encodeSSE({
                data: {
                  id: streamId ?? `chatcmpl-${crypto.randomUUID()}`,
                  object: 'chat.completion.chunk',
                  created: streamCreated ?? Math.floor(Date.now() / 1000),
                  model: streamModel ?? 'unknown',
                  choices: [],
                  usage: latestUsage,
                },
              });
              hooks?.onDownstreamChunk?.(usageChunk);
              controller.enqueue(encoder.encode(usageChunk));
            }
            if (!sawDone) {
              sawDone = true;
              const doneChunk = encodeSSE({ data: '[DONE]' });
              hooks?.onDownstreamChunk?.(doneChunk);
              controller.enqueue(encoder.encode(doneChunk));
            }
            continue;
          }
          const chunk = parseSSEJson(frame, 'Upstream returned invalid streaming JSON');
          if (isObject(chunk)) {
            if (typeof chunk.id === 'string') streamId = chunk.id;
            if (typeof chunk.model === 'string') streamModel = chunk.model;
            if (typeof chunk.created === 'number') streamCreated = chunk.created;
            const usage = normalizeOpenAIUsage(chunk.usage);
            if (usage) latestUsage = usage;
            if (usage && Array.isArray(chunk.choices) && chunk.choices.length === 0) sawUsageOnlyChunk = true;
          }
          const outChunk = encodeSSE({ event: frame.event, data: chunk });
          hooks?.onDownstreamChunk?.(outChunk);
          controller.enqueue(encoder.encode(outChunk));
        }
        if (cancelled || abortController.signal.aborted) return;
        hooks?.onUpstreamComplete?.(true);
      } catch {
        if (cancelled || abortController.signal.aborted) return;
        hooks?.onUpstreamComplete?.(false);
        // OpenAI chat streams do not have a clean post-start error frame. Close
        // the stream with a single done marker instead of leaking malformed SSE.
      }
      if (cancelled || abortController.signal.aborted) return;
      if (!sawDone) {
        if (includeUsage && latestUsage && !sawUsageOnlyChunk) {
          const usageChunk = encodeSSE({
            data: {
              id: streamId ?? `chatcmpl-${crypto.randomUUID()}`,
              object: 'chat.completion.chunk',
              created: streamCreated ?? Math.floor(Date.now() / 1000),
              model: streamModel ?? 'unknown',
              choices: [],
              usage: latestUsage,
            },
          });
          hooks?.onDownstreamChunk?.(usageChunk);
          controller.enqueue(encoder.encode(usageChunk));
        }
        const doneChunk = encodeSSE({ data: '[DONE]' });
        hooks?.onDownstreamChunk?.(doneChunk);
        controller.enqueue(encoder.encode(doneChunk));
      }
      controller.close();
    },
    async cancel(reason) {
      cancelled = true;
      abortController.abort(reason);
      try { await iterator?.return?.(undefined); } catch { /* ignore cancellation races */ }
    },
  });
}

export async function* parseSSEStream(body: ReadableStream<Uint8Array>, chunkTimeoutMs?: number, signal?: AbortSignal): AsyncGenerator<ParsedSSEFrame> {
  const decoder = new TextDecoder();
  const reader = body.getReader();
  const readTimeout = chunkTimeoutMs ?? 300_000; // default 5 min per chunk
  let buffer = '';
  let completed = false;
  try {
    while (true) {
      const result = await readSSEChunk(reader, readTimeout, signal);
      if (result.done) {
        completed = true;
        break;
      }
      buffer += decoder.decode(result.value, { stream: true });
      const frames = splitFrames(buffer);
      buffer = frames.remainder;
      for (const block of frames.complete) {
        const frame = parseSSEBlock(block);
        if (frame) yield frame;
      }
    }
    buffer += decoder.decode();
    if (buffer.trim().length > 0) {
      throw upstreamError('stream_interrupted', 'Upstream stream ended mid-frame');
    }
  } finally {
    if (!completed) {
      try { await reader.cancel(signal?.reason); } catch { /* already closed */ }
    }
    try { reader.releaseLock(); } catch { /* already released */ }
  }
}

function readSSEChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const settle = (fn: typeof resolve | typeof reject, value: ReadableStreamReadResult<Uint8Array> | Error) => {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onAbort);
      (fn as (v: ReadableStreamReadResult<Uint8Array> | Error) => void)(value);
    };
    const onAbort = () => settle(reject, signal?.reason instanceof Error ? signal.reason : new DOMException('SSE stream cancelled', 'AbortError'));

    if (signal?.aborted) {
      onAbort();
      return;
    }
    if (signal) signal.addEventListener('abort', onAbort, { once: true });

    timeoutId = setTimeout(() => settle(reject, new Error('SSE stream chunk read timed out')), timeoutMs);
    (timeoutId as { unref?: () => void }).unref?.();

    reader.read().then(
      (result) => settle(resolve, result),
      (error) => settle(reject, error instanceof Error ? error : new Error(String(error))),
    );
  });
}

export function parseSSEJson(frame: ParsedSSEFrame, message = 'Upstream returned invalid streaming JSON'): any {
  try {
    return JSON.parse(frame.data);
  } catch {
    throw upstreamError('bad_response', message);
  }
}

export function anthropicEventsToOpenAIChunks(events: Array<{ event: string; data: any }>): string[] {
  const chunks: string[] = [];
  let id = 'chatcmpl-anthropic';
  let model = 'unknown';
  let stopReason: string | null = null;
  for (const item of events) {
    if (item.event === 'message_start') {
      id = item.data?.message?.id ?? id;
      model = item.data?.message?.model ?? model;
      chunks.push(encodeSSE({ data: chunk(id, model, { role: 'assistant' }, null) }));
    } else if (item.event === 'content_block_delta' && item.data?.delta?.type === 'text_delta') {
      chunks.push(encodeSSE({ data: chunk(id, model, { content: item.data.delta.text ?? '' }, null) }));
    } else if (item.event === 'message_delta') {
      stopReason = openAIStopReason(item.data?.delta?.stop_reason);
      chunks.push(encodeSSE({ data: chunk(id, model, {}, stopReason) }));
    } else if (item.event === 'message_stop') {
      chunks.push(encodeSSE({ data: '[DONE]' }));
    }
  }
  if (chunks.at(-1) !== 'data: [DONE]\n\n') chunks.push(encodeSSE({ data: '[DONE]' }));
  return chunks;
}

function chunk(id: string, model: string, delta: Record<string, unknown>, finishReason: string | null) {
  return {
    id,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  };
}

function openAIStopReason(reason: unknown): string {
  if (reason === 'max_tokens') return 'length';
  if (reason === 'tool_use') return 'tool_calls';
  if (reason === 'stop_sequence') return 'stop';
  return 'stop';
}

function splitFrames(buffer: string): { complete: string[]; remainder: string } {
  const complete: string[] = [];
  let start = 0;
  for (let index = 0; index < buffer.length - 1; index++) {
    if (buffer[index] === '\n' && buffer[index + 1] === '\n') {
      complete.push(buffer.slice(start, index));
      start = index + 2;
      index += 1;
    } else if (buffer[index] === '\r' && buffer[index + 1] === '\n' && buffer[index + 2] === '\r' && buffer[index + 3] === '\n') {
      complete.push(buffer.slice(start, index));
      start = index + 4;
      index += 3;
    }
  }
  return {
    complete,
    remainder: buffer.slice(start),
  };
}

function parseSSEBlock(block: string): ParsedSSEFrame | undefined {
  let event: string | undefined;
  const data: string[] = [];
  for (const rawLine of block.split('\n')) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (line.length === 0 || line.startsWith(':')) continue;
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      data.push(line.slice('data:'.length).trimStart());
    }
  }
  if (data.length === 0) return undefined;
  return { event, data: data.join('\n') };
}

function normalizeOpenAIUsage(value: unknown): { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined {
  if (!isObject(value)) return undefined;
  const promptTokens = typeof value.prompt_tokens === 'number' ? value.prompt_tokens : undefined;
  const completionTokens = typeof value.completion_tokens === 'number' ? value.completion_tokens : undefined;
  const totalTokens = typeof value.total_tokens === 'number' ? value.total_tokens : undefined;
  if (promptTokens === undefined && completionTokens === undefined && totalTokens === undefined) return undefined;
  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
  };
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
