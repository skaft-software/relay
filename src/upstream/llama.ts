import { GatewayError, upstreamError } from '../errors.ts';
import type { AppConfig } from '../config.ts';
import { redactText } from '../redact.ts';
import { parseJson } from '../json.ts';

export type UpstreamResult = {
  response: Response;
};

export async function upstreamJson(config: AppConfig, path: string, init: RequestInit = {}, externalSignal?: AbortSignal): Promise<unknown> {
  const result = await upstreamFetch(config, path, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.headers ?? {}),
    },
  }, externalSignal);
  if (!result.response.ok) {
    throw await upstreamHttpError(result.response, config, externalSignal);
  }
  return readLimitedJson(result.response, config.maxUpstreamResponseBytes, externalSignal, config.requestTimeoutMs);
}

export async function upstreamFetch(
  config: AppConfig,
  path: string,
  init: RequestInit = {},
  externalSignal?: AbortSignal,
  upstreamBaseUrlOverride?: string,
  upstreamAuthHeaderOverride?: string,
): Promise<UpstreamResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  const signal = externalSignal ? AbortSignal.any([controller.signal, externalSignal]) : controller.signal;
  const baseUrl = upstreamBaseUrlOverride ?? config.upstreamBaseUrl;

  // Inject cloud API auth header when set by cloud mode (override takes precedence).
  const headers = new Headers(init.headers);
  const effectiveAuthHeader = upstreamAuthHeaderOverride ?? config.upstreamAuthHeader;
  if (effectiveAuthHeader && !headers.has('authorization')) {
    headers.set('authorization', effectiveAuthHeader);
  }

  try {
    const response = await fetch(upstreamUrl(baseUrl, path), {
      ...init,
      headers,
      signal,
    });
    return { response };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (externalSignal?.aborted) {
        throw upstreamError('unavailable', 'Request cancelled by client disconnect');
      }
      throw upstreamError('timeout', 'Upstream llama server timed out');
    }
    throw upstreamError('unavailable', 'Upstream llama server is unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

export async function upstreamHttpError(response: Response, config?: AppConfig, externalSignal?: AbortSignal) {
  if (config && config.exposeUpstreamErrors !== true) {
    return new GatewayError(
      502,
      `Upstream llama server returned HTTP ${response.status}`,
      'upstream_error',
      'upstream_unavailable',
      null,
      response.status,
    );
  }
  const detail = await readUpstreamErrorDetail(response, config?.maxUpstreamResponseBytes ?? 16_777_216, externalSignal, config?.requestTimeoutMs);
  return new GatewayError(
    502,
    detail ? truncateAndRedact(detail) : `Upstream llama server returned HTTP ${response.status}`,
    'upstream_error',
    'upstream_unavailable',
    null,
    response.status,
  );
}

export async function readLimitedText(response: Response, maxBytes: number, externalSignal?: AbortSignal, bodyTimeoutMs?: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  const effectiveTimeout = bodyTimeoutMs && bodyTimeoutMs > 0 ? bodyTimeoutMs : undefined;
  try {
    while (true) {
      if (externalSignal?.aborted) {
        throw upstreamError('unavailable', 'Request cancelled by client disconnect');
      }
      // Race each read() against a per-read timeout so a stalled upstream
      // that sends headers but never finishes the body cannot hang forever.
      const { done, value } = await readChunk(reader, effectiveTimeout, externalSignal);
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        throw upstreamError('bad_response', `Upstream response exceeds maximum size of ${maxBytes} bytes`);
      }
      chunks.push(value);
    }
  } finally {
    try { reader.releaseLock(); } catch { /* already released */ }
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** Read one chunk from a stream reader, racing against a per-chunk timeout. */
async function readChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs?: number,
  signal?: AbortSignal,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  if (!timeoutMs || timeoutMs <= 0) {
    return reader.read();
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new DOMException('Upstream body read timed out', 'TimeoutError'));
    }, timeoutMs);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Request cancelled by client disconnect', 'AbortError'));
    };
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        reject(new DOMException('Request cancelled by client disconnect', 'AbortError'));
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }
    reader.read().then(
      (result) => {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve(result);
      },
      (err) => {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        reject(err);
      },
    );
  });
}

export async function readLimitedJson(response: Response, maxBytes: number, externalSignal?: AbortSignal, bodyTimeoutMs?: number): Promise<unknown> {
  const text = await readLimitedText(response, maxBytes, externalSignal, bodyTimeoutMs);
  try {
    return parseJson(text);
  } catch {
    throw upstreamError('bad_response', 'Upstream returned invalid JSON');
  }
}

function upstreamUrl(baseUrl: string, path: string): string {
  if (baseUrl.endsWith('/v1') && path.startsWith('/v1/')) {
    return `${baseUrl}${path.slice('/v1'.length)}`;
  }
  return `${baseUrl}${path}`;
}

async function readUpstreamErrorDetail(response: Response, maxBytes: number, externalSignal?: AbortSignal, bodyTimeoutMs?: number): Promise<string | undefined> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      const payload = await readLimitedJson(response, maxBytes, externalSignal, bodyTimeoutMs);
      const message = extractMessage(payload);
      if (message) return message;
    } catch {
      return undefined;
    }
  }

  try {
    const text = (await readLimitedText(response, maxBytes, externalSignal, bodyTimeoutMs)).trim();
    return text ? text.slice(0, 500) : undefined;
  } catch {
    return undefined;
  }
}

function extractMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const record = payload as Record<string, unknown>;
  if (typeof record.message === 'string' && record.message.trim()) return record.message.trim();
  if (typeof record.error === 'string' && record.error.trim()) return record.error.trim();
  if (record.error && typeof record.error === 'object') {
    const nested = record.error as Record<string, unknown>;
    if (typeof nested.message === 'string' && nested.message.trim()) return nested.message.trim();
  }
  return undefined;
}

function truncateAndRedact(message: string): string {
  const truncated = message.length > 200 ? `${message.slice(0, 200)}...` : message;
  return redactText(truncated);
}
