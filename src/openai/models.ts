import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { AppConfig, ModelEntry } from '../config.ts';
import { GatewayError, jsonResponse } from '../errors.ts';
import { upstreamJson } from '../upstream/llama.ts';
import { activeProfile } from '../profile.ts';
import { readCatalog, type CatalogEntry } from '../setup-logic.ts';
import { scanGgufs } from '../models.ts';

/**
 * Discover all models available to relay:
 * 1. Static modelEntries (from RELAY_MODEL_MAP) — full lifecycle support
 * 2. On-disk GGUFs matched against the catalog — auto-discovered, served without
 *    pre-provisioning. Relay auto-generates a start config when first requested.
 */
export function discoverModels(config: AppConfig): Array<{
  id: string;
  entry?: ModelEntry;
  catalogEntry?: CatalogEntry;
  onDisk: boolean;
  ggufPath?: string;
}> {
  const modelDir = process.env.RELAY_MODEL_DIR ||
    resolve(process.env.HOME ?? '/home', 'models');
  const catalog = readCatalog();

  // Build an index: catalog id → entry, and quick lookup by filename
  const catalogById = new Map<string, CatalogEntry>();
  const catalogByFilename = new Map<string, CatalogEntry>();
  for (const c of catalog) {
    catalogById.set(c.id, c);
    if (c.filename) catalogByFilename.set(c.filename.toLowerCase(), c);
  }

  const onDisk = scanGgufs(modelDir);
  const result: Map<string, {
    id: string;
    entry?: ModelEntry;
    catalogEntry?: CatalogEntry;
    onDisk: boolean;
    ggufPath?: string;
  }> = new Map();

  // First pass: static entries. They are provisioned, but only advertised when
  // the GGUF is still on disk. This keeps /v1/models honest after a user deletes
  // a model file without regenerating RELAY_MODEL_MAP.
  if (config.modelEntries) {
    for (const [id, entry] of Object.entries(config.modelEntries)) {
      const catEntry = catalogById.get(id) ??
        (entry.cmd ? catalogByFilename.get(basenameOf(entry.cmd).toLowerCase()) : undefined);
      const scriptModelPath = modelPathFromStartCommand(entry.cmd);
      let ggufPath: string | undefined;
      if (scriptModelPath && existsSync(scriptModelPath)) {
        ggufPath = scriptModelPath;
      } else if (!scriptModelPath) {
        for (const g of onDisk) {
          if (g.name.toLowerCase() === (catEntry?.filename ?? '').toLowerCase() ||
              g.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(id.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
            ggufPath = g.path;
            break;
          }
        }
      }
      result.set(id, { id: entry.name ?? id, entry, catalogEntry: catEntry, onDisk: Boolean(ggufPath), ggufPath });
    }
  }

  // Second pass: on-disk models not yet in the static map
  for (const g of onDisk) {
    // Try to match this GGUF to a catalog entry
    let catEntry = catalogByFilename.get(g.name.toLowerCase());
    if (!catEntry) {
      // Try stem matching
      const stem = g.name.toLowerCase().replace(/\.gguf$/, '').replace(/[^a-z0-9]/g, '');
      for (const c of catalog) {
        const cStem = c.id.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cStem.length > 6 && stem.includes(cStem)) { catEntry = c; break; }
      }
    }
    if (!catEntry) continue; // can't serve models we don't know about

    // Skip if already covered by a static entry
    if (result.has(catEntry.id)) continue;
    // Also skip if any static entry already maps to this file
    let alreadyMapped = false;
    for (const [, v] of result) {
      if (v.ggufPath === g.path) { alreadyMapped = true; break; }
    }
    if (alreadyMapped) continue;

    result.set(catEntry.id, {
      id: catEntry.id,
      catalogEntry: catEntry,
      onDisk: true,
      ggufPath: g.path,
    });
  }

  return [...result.values()];
}

function basenameOf(p: string): string {
  const parts = p.split('/');
  return parts[parts.length - 1] ?? p;
}

function modelPathFromStartCommand(cmd: string): string | undefined {
  if (!existsSync(cmd)) return undefined;
  try {
    const script = readFileSync(cmd, 'utf8');
    const match = /^\s*(?:MODEL|MODEL_PATH)=(?:'([^']+)'|"([^"]+)"|([^\s#]+))/m.exec(script);
    return match?.[1] ?? match?.[2] ?? match?.[3];
  } catch {
    return undefined;
  }
}

export async function handleModels(config: AppConfig, model?: string, externalSignal?: AbortSignal): Promise<Response> {
  // When modelEntries is configured (gateway mode), merge static map with on-disk discovery.
  if (config.modelEntries) {
    const discovered = discoverModels(config);
    // Only advertise models that have a static entry and whose GGUF is still on
    // disk. On-disk GGUFs matched from the catalog but not yet provisioned are
    // excluded — they have no start script and will fail at runtime.
    const provisioned = discovered.filter((d) => d.entry != null && d.onDisk);
    const allModels = provisioned.map((d) => {
      const entry = d.entry;
      const cat = d.catalogEntry;
      const id = d.id;

      const ctxSize = entry?.ctx_size ?? cat?.ctx ?? config.upstreamCtxSize;
      const multimodal = entry?.multimodal ?? cat?.vision ?? false;
      const thinkingLevels = entry?.thinking_levels ??
        (cat?.thinking === 'on' ? ['on'] : cat?.thinking === 'toggle' ? ['on', 'off'] : undefined);
      const profile = activeProfile(config, id);
      const thinkingSupported = thinkingLevels ? thinkingLevels.length > 0 : profile.thinking.supported;

      const caps: string[] = ['completion'];
      if (multimodal) caps.push('multimodal');

      const meta: Record<string, unknown> = {};
      if (ctxSize) meta.n_ctx = ctxSize;
      // Tag auto-discovered models so clients know they may need cold-start
      if (!entry && d.onDisk) meta.auto_discovered = true;

      return {
        id,
        object: 'model',
        created: 0,
        owned_by: 'local',
        capabilities: caps,
        supports_thinking: thinkingSupported,
        thinking_levels: thinkingLevels ?? (thinkingSupported ? ['on', 'off'] : undefined),
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
