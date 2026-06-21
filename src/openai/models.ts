import type { AppConfig } from '../config.ts';
import { GatewayError, jsonResponse } from '../errors.ts';
import { upstreamJson } from '../upstream/llama.ts';
import { activeProfile } from '../profile.ts';

export async function handleModels(config: AppConfig, model?: string, externalSignal?: AbortSignal): Promise<Response> {
  // When modelEntries is configured, serve the list directly from relay config.
  if (config.modelEntries) {
    const allModels = Object.keys(config.modelEntries).map((id) => {
      const entry = config.modelEntries![id];
      const ctxSize = entry.ctx_size ?? config.upstreamCtxSize;
      const profile = activeProfile(config, id);
      const caps: string[] = ['completion'];
      if (entry.multimodal === true) caps.push('multimodal');
      const meta: Record<string, unknown> = {};
      if (ctxSize) meta.n_ctx = ctxSize;
      return {
        id: entry.name ?? id,
        object: 'model',
        created: 0,
        owned_by: 'local',
        capabilities: caps,
        supports_thinking: profile.thinking.supported,
        thinking_levels: profile.thinking.levels,
        meta: Object.keys(meta).length ? meta : undefined,
      };
    });

    if (model) {
      const found = allModels.find(
        (m) => m.id === model || m.id.toLowerCase() === model.toLowerCase()
      );
      if (!found) throw new GatewayError(404, `Model ${model} not found`);
      return jsonResponse(found);
    }
    return jsonResponse({ object: 'list', data: allModels });
  }

  // Fallback: proxy to upstream.
  try {
    const path = model ? `/v1/models/${encodeURIComponent(model)}` : '/v1/models';
    const raw = await upstreamJson(config, path, {}, externalSignal);
    const patched = enrichWithCtxSize(raw, config);
    return jsonResponse(patched);
  } catch (error) {
    if (!(error instanceof GatewayError)) throw error;
    if (config.defaultModel) {
      if (model && model !== config.defaultModel) {
        throw new GatewayError(404, `Model ${model} not found`);
      }
      const synthetic = syntheticModel(config);
      return jsonResponse(model ? synthetic : { object: 'list', data: [synthetic] });
    }
    throw error;
  }
}

/**
 * Inject running context size into the model list response.
 * The upstream (e.g. llama.cpp) reports n_ctx_train from the GGUF file,
 * but the actual running context may differ (--ctx-size flag). Relay
 * annotates each model entry with the real running context so clients
 * like Pi can discover it via the API instead of probing process args.
 */
function enrichWithCtxSize(
  raw: unknown,
  config: AppConfig,
): unknown {
  if (!config.upstreamCtxSize && !config.thinkingSupported) return raw;
  const n = config.upstreamCtxSize;
  const profile = activeProfile(config);

  // /v1/models returns { object: 'list', data: [ {...} ] }
  if (isObject(raw) && Array.isArray((raw as any).data)) {
    const list = raw as { object?: string; data: unknown[] };
    if (!Array.isArray(list.data)) return raw;
    list.data = list.data.map((item: unknown) => {
      if (!isObject(item)) return item;
      const entry = item as Record<string, unknown>;
      // Inject thinking fields at top level
      if (config.thinkingSupported) {
        entry.supports_thinking = profile.thinking.supported;
        entry.thinking_levels = profile.thinking.levels;
      }
      // Inject ctx size into meta
      if (n) {
        const meta = isObject(entry.meta)
          ? { ...entry.meta } as Record<string, unknown>
          : {};
        meta.n_ctx = n;
        entry.meta = meta;
      }
      return entry;
    });
    return list;
  }

  return raw;
}

function syntheticModel(config: AppConfig) {
  const profile = activeProfile(config);
  const base: Record<string, unknown> = {
    id: config.defaultModel ?? 'local',
    object: 'model',
    created: 0,
    owned_by: 'local',
    capabilities: ['completion'],
    supports_thinking: profile.thinking.supported,
    thinking_levels: profile.thinking.levels,
  };
  if (config.upstreamCtxSize) base.meta = { n_ctx: config.upstreamCtxSize };
  return base;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
