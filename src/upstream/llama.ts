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
    throw await upstreamHttpError(result.response, config);
  }
  return readLimitedJson(result.response, config.maxUpstreamResponseBytes);
}

export async function upstreamFetch(config: AppConfig, path: string, init: RequestInit = {}, externalSignal?: AbortSignal): Promise<UpstreamResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  const signal = externalSignal ? AbortSignal.any([controller.signal, externalSignal]) : controller.signal;
  try {
    const response = await fetch(upstreamUrl(config.upstreamBaseUrl, path), {
      ...init,
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

export async function upstreamHttpError(response: Response, config?: AppConfig) {
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
  const detail = await readUpstreamErrorDetail(response, config?.maxUpstreamResponseBytes ?? 16_777_216);
  return new GatewayError(
    502,
    detail ? truncateAndRedact(detail) : `Upstream llama server returned HTTP ${response.status}`,
    'upstream_error',
    'upstream_unavailable',
    null,
    response.status,
  );
}

export async function readLimitedText(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        throw upstreamError('bad_response', `Upstream response exceeds maximum size of ${maxBytes} bytes`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function readLimitedJson(response: Response, maxBytes: number): Promise<unknown> {
  const text = await readLimitedText(response, maxBytes);
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

async function readUpstreamErrorDetail(response: Response, maxBytes: number): Promise<string | undefined> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    try {
      const payload = await readLimitedJson(response, maxBytes);
      const message = extractMessage(payload);
      if (message) return message;
    } catch {
      return undefined;
    }
  }

  try {
    const text = (await readLimitedText(response, maxBytes)).trim();
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
