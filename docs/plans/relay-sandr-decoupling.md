# Relay / Sandr Decoupling Plan

## Current Responsibility Map (at `~/relay` on temper-inference)

### Relay-Owned (API Normalization Gateway)

| File | Responsibility |
|------|---------------|
| `src/server.ts` | HTTP server, routing, middleware, CORS, SSE streaming + lifecycle integration |
| `src/config.ts` | Config loading from env vars (both relay and sandr concerns interleaved) |
| `src/main.ts` | Entry point, signal handling, graceful shutdown |
| `src/auth.ts` | API key validation, rate limiting |
| `src/errors.ts` | GatewayError, OpenAI/Anthropic error shapes |
| `src/json.ts` | JSON parse/stringify helpers |
| `src/logger.ts` | Structured logger |
| `src/redact.ts` | Secrets redaction for logs |
| `src/openai/chat.ts` | `/v1/chat/completions` handler |
| `src/openai/responses.ts` | `/v1/responses` handler |
| `src/openai/embeddings.ts` | `/v1/embeddings` handler |
| `src/openai/response-format.ts` | JSON schema / response format normalization |
| `src/normalize/stream.ts` | SSE frame parsing, OpenAI↔Anthropic stream conversion |
| `src/normalize/messages.ts` | Message format normalization between protocols |
| `src/normalize/tools.ts` | Tool call normalization (OpenAI ↔ Anthropic) |
| `src/anthropic/messages.ts` | `/v1/messages` handler |
| `src/internal/canonical.ts` | Internal canonical type definitions |
| `src/internal/openai-chat.ts` | OpenAI chat → canonical conversion |
| `src/internal/openai-responses.ts` | OpenAI responses → canonical conversion |
| `src/internal/anthropic-messages.ts` | Anthropic messages → canonical conversion |
| `src/internal/response.ts` | Response building from canonical |
| `src/internal/sampling.ts` | Sampling parameter normalization |
| `src/observability.ts` | Request/response capture, stats, comparison |
| `src/cloud.ts` | Cloud API model registry (DeepSeek, Groq, etc.) |
| `src/jobs.ts` | Async job queue with long-poll |
| `src/mutex.ts` | Request serialization mutex |
| `src/field-policy.ts` | Unknown field strip/pass_through/reject |
| `src/truncation-diagnostics.ts` | Truncation diagnostics |
| `src/upstream/llama.ts` | Generic HTTP upstream client (fetch, timeout, error handling) |

### Sandr-Owned (Model / Runtime Setup)

| File | Responsibility |
|------|---------------|
| `src/profile.ts` | Hardcoded model family profiles (qwen, deepseek, gemma, etc.) — **provider descriptor data** |
| `src/lifecycle.ts` | Model process lifecycle: start/kill llama-server, port allocation, health probes, eager switching, idle shutdown, circuit breaker — **runtime driver** |
| `src/capabilities.ts` | Capability probing: probes upstream endpoints, checks features — **runtime health + provider descriptor consumer** |
| `src/openai/models.ts` | `/v1/models` handler — serves model list from config OR proxies upstream — **provider descriptor consumer** |

### Shared (currently interleaved, needs splitting)

| Concern | Where it lives | Split Target |
|---------|---------------|-------------|
| `ModelEntry` type | `src/config.ts` | → shared type (Sandr writes, Relay reads) |
| `RelayModelProfileId` type | `src/config.ts` | → shared type |
| `RelayModelProfile` data | `src/profile.ts` | → Sandr provider descriptor output |
| `modelEntries` config | env var `RELAY_MODEL_MAP` | → Sandr provider descriptor JSON |
| `RELAY_MODEL_PROFILE` | env var | → derived from Sandr descriptor |
| `RELAY_MODEL_LIFECYCLE_ENABLED` | env var | → Sandr controls |
| `upstreamBaseUrl` | env var | → Sandr tells Relay where models live |
| Network mode `host` | `docker-compose.yml` | → Sandr docker config |
| `/dev/dri`, `/dev/nvidia` | `docker-compose.yml` | → Sandr docker config |
| llama.cpp mount | `docker-compose.yml` | → Sandr docker config |
| Start scripts | `docker-compose.yml` mounts | → Sandr manages |
| `Dockerfile` | root dir | → Sandr adds llama.cpp, Relay stays minimal |
| `scripts/doctor.ts` | `scripts/` | → Sandr diagnostic tool |
| `scripts/install.sh` | `scripts/` | → Sandr install flow |
| `scripts/probe-gpu.sh` | `scripts/` | → Sandr GPU probe |
| Smoke tests | `scripts/smoke-*.ts` | → Sandr smoke tests |

---

## Proposed Package / Module Boundaries

```
relay/                        # Tiny, always-on, no Sandr dependency
├── src/
│   ├── main.ts               # Entry point
│   ├── server.ts             # HTTP server, routing
│   ├── config.ts             # Relay-only config (port, auth, cors, observability, timeouts)
│   ├── auth.ts
│   ├── errors.ts
│   ├── logger.ts
│   ├── redact.ts
│   ├── json.ts
│   ├── mutex.ts
│   ├── field-policy.ts
│   ├── observability.ts
│   ├── cloud.ts              # Cloud API bridging (independent of Sandr)
│   ├── jobs.ts
│   ├── truncation-diagnostics.ts
│   ├── upstream/
│   │   └── client.ts         # Generic HTTP upstream client (no Sandr knowledge)
│   ├── openai/
│   │   ├── chat.ts
│   │   ├── responses.ts
│   │   ├── embeddings.ts
│   │   └── response-format.ts
│   ├── normalize/
│   │   ├── stream.ts
│   │   ├── messages.ts
│   │   └── tools.ts
│   ├── anthropic/
│   │   └── messages.ts
│   ├── internal/
│   │   ├── canonical.ts
│   │   ├── openai-chat.ts
│   │   ├── openai-responses.ts
│   │   ├── anthropic-messages.ts
│   │   ├── response.ts
│   │   └── sampling.ts
│   └── provider/              # ← NEW: provider descriptor discovery
│       ├── types.ts           # Shared contract types
│       └── discover.ts        # Discover & load provider descriptors
├── tests/
│   ├── provider-discovery.test.ts  # ← NEW
│   └── ...
├── Dockerfile                # Minimal: just Node + relay code
├── package.json
└── tsconfig.json

sandr/                        # Model runtime — separate package or repo
├── providers/
│   └── llamacpp/
│       ├── provider.json     # Provider descriptor (written by Sandr, read by Relay)
│       └── start-llama.sh
├── src/
│   ├── lifecycle.ts          # Model process management (moved from relay)
│   ├── capabilities.ts       # Capability probing (moved from relay)
│   ├── profiles.ts           # Provider profile definitions (moved from relay/src/profile.ts)
│   └── models.ts             # Model list assembly (moved from relay/src/openai/models.ts)
├── scripts/
│   ├── doctor.ts
│   ├── install.sh
│   ├── probe-gpu.sh
│   └── smoke-*.ts
├── Dockerfile                # Sandr runtime: Node + llama.cpp + drivers
└── docker-compose.yml        # GPU devices, model mounts, start scripts
```

---

## Shared File Contract

### `relay/src/provider/types.ts` (Relay publishes; Sandr conforms)

This is the single source of truth for the contract. Sandr writes JSON files conforming to `ProviderDescriptor`. Relay reads them.

```typescript
// relay/src/provider/types.ts
// Shared contract: Sandr writes these, Relay imports them.

/** Provider descriptor written by Sandr, consumed by Relay on startup. */
export type ProviderDescriptor = {
  /** Unique provider ID (e.g. "llamacpp", "sandr-local") */
  provider_id: string;
  /** Human-readable name */
  provider_name: string;
  /** Provider version (for compatibility checks) */
  provider_version: string;
  /** Models this provider serves */
  models: ProviderModel[];
  /** Profile hints for API normalization */
  profile: ProviderProfile;
  /** How to reach this provider's upstream */
  upstream: ProviderUpstream;
};

export type ProviderModel = {
  /** Model ID that clients use in API requests */
  id: string;
  /** Optional display name (defaults to id) */
  name?: string;
  /** Running context window size */
  ctx_size?: number;
  /** Supports multimodal (vision/audio) input */
  multimodal?: boolean;
  /** Thinking/brainstorming levels this model supports */
  thinking_levels?: string[];
  /** Per-model sampling default overrides */
  sampling?: ProviderSamplingDefaults;
};

export type ProviderProfile = {
  /** Model family profile ID for normalization */
  model_profile_id:
    | 'generic'
    | 'qwen'
    | 'deepseek'
    | 'gemma'
    | 'mistral'
    | 'llama'
    | 'kimi'
    | 'openai_compatible'
    | 'anthropic_compatible';
  /** Reasoning content handling mode */
  reasoning_mode?: 'off' | 'raw' | 'parsed' | 'preserve';
  /** Tool calling mode */
  tool_mode?: 'auto' | 'native' | 'generic' | 'off';
  /** Whether thinking is supported */
  thinking_supported?: boolean;
  /** Available thinking levels */
  thinking_levels?: string[];
  /** Expected context window guidance */
  expected_context?: {
    recommended?: string;
    ceiling?: string;
    notes?: string;
  };
  /** Known client compatibility notes */
  known_client_compatibility?: string[];
  /** Known failure modes */
  known_failure_modes?: string[];
  /** Recommended agent workflow notes */
  recommended_agent_workflow?: string[];
};

export type ProviderUpstream = {
  /** Base URL of the upstream API (must include /v1) */
  base_url: string;
  /** Health check URL path (default: /health) */
  health_url?: string;
  /** Optional auth header to inject */
  auth_header?: string;
};

export type ProviderSamplingDefaults = {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  min_p?: number;
  presence_penalty?: number;
  repeat_penalty?: number;
};

/** Discovery directory — Relay looks here for *.provider.json files */
export const PROVIDER_DISCOVERY_PATH = 'RELAY_PROVIDER_PATH';
export const DEFAULT_PROVIDER_PATH = '/etc/relay/providers';
```

### Example Sandr provider descriptor (`llamacpp.provider.json`):

```json
{
  "provider_id": "llamacpp",
  "provider_name": "llama.cpp (Sandr)",
  "provider_version": "0.1.0",
  "models": [
    {
      "id": "qwen3.6-35b-a3b",
      "name": "Qwen 3.6 35B A3B",
      "ctx_size": 98304,
      "multimodal": false,
      "sampling": { "temperature": 0.6 }
    },
    {
      "id": "gemma-4-26b",
      "name": "Gemma 4 26B",
      "ctx_size": 98304,
      "multimodal": true
    }
  ],
  "profile": {
    "model_profile_id": "qwen",
    "reasoning_mode": "preserve",
    "tool_mode": "auto",
    "thinking_supported": true,
    "thinking_levels": ["on", "off"],
    "expected_context": {
      "recommended": "16k-32k",
      "notes": "Start small, raise context after transport and streaming are stable."
    }
  },
  "upstream": {
    "base_url": "http://127.0.0.1:8080/v1",
    "health_url": "/health"
  }
}
```

---

## Minimal Migration Patch

Four-file change: create the provider discovery mechanism and wire it into existing config, profiles, and models — without removing the existing hardcoded paths. Relay works exactly as before when no Sandr provider is present.

### File 1: `src/provider/types.ts` (NEW)

```typescript
// Shared contract types — see full definition above in section 3.
// This is the ONLY file that both Relay and Sandr must agree on.
export type ProviderDescriptor = { /* ... as defined above ... */ };
export const PROVIDER_DISCOVERY_PATH = 'RELAY_PROVIDER_PATH';
export const DEFAULT_PROVIDER_PATH = '/etc/relay/providers';
```

### File 2: `src/provider/discover.ts` (NEW)

```typescript
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ProviderDescriptor } from './types.ts';
import { PROVIDER_DISCOVERY_PATH, DEFAULT_PROVIDER_PATH } from './types.ts';

const descriptorSuffix = '.provider.json';

/**
 * Discover all Sandr provider descriptors from the configured directory.
 * Returns an empty array when no Sandr providers are installed
 * (Relay works standalone with its own hardcoded defaults).
 */
export function discoverProviders(): ProviderDescriptor[] {
  const providerPath = process.env[PROVIDER_DISCOVERY_PATH] ?? DEFAULT_PROVIDER_PATH;
  if (!existsSync(providerPath)) return [];

  const results: ProviderDescriptor[] = [];
  try {
    const entries = readdirSync(providerPath);
    for (const entry of entries) {
      if (!entry.endsWith(descriptorSuffix)) continue;
      try {
        const fullPath = join(providerPath, entry);
        const raw = readFileSync(fullPath, 'utf-8');
        const parsed = JSON.parse(raw) as ProviderDescriptor;
        if (!parsed.provider_id || !parsed.models?.length) {
          console.warn(`[relay] Skipping invalid provider descriptor: ${entry}`);
          continue;
        }
        results.push(parsed);
      } catch (err) {
        console.warn(`[relay] Failed to load provider descriptor ${entry}:`, err);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read — no Sandr providers.
  }
  return results;
}

/**
 * Find the first provider that serves a given model name (case-insensitive).
 */
export function findProviderForModel(
  providers: ProviderDescriptor[],
  modelName: string,
): ProviderDescriptor | undefined {
  const lower = modelName.toLowerCase();
  return providers.find((p) =>
    p.models.some((m) => m.id.toLowerCase() === lower),
  );
}

/**
 * Get the upstream config for a model from discovered providers.
 */
export function upstreamForModel(
  providers: ProviderDescriptor[],
  modelName: string,
): { baseUrl: string; authHeader?: string } | undefined {
  const provider = findProviderForModel(providers, modelName);
  if (!provider) return undefined;
  return provider.upstream;
}

/**
 * Get the profile for a model from discovered providers.
 */
export function profileForModel(
  providers: ProviderDescriptor[],
  modelName: string,
): ProviderDescriptor['profile'] | undefined {
  const provider = findProviderForModel(providers, modelName);
  return provider?.profile;
}
```

### File 3: Modify `src/config.ts` — add provider discovery and merge model entries

Add to `AppConfig`:
```typescript
  /** Discovered Sandr provider descriptors */
  providers?: ProviderDescriptor[];
```

Add to `loadConfig()`:
```typescript
  // Discover Sandr providers
  const providers = discoverProviders();
  // Merge provider models into modelEntries (provider models take lowest priority)
  const mergedModelEntries = mergeModelEntries(
    readModelEntries(env.RELAY_MODEL_MAP),
    providers,
  );
  return {
    // ... existing fields ...
    modelEntries: mergedModelEntries,
    providers,
  };
```

Add merge helper:
```typescript
function mergeModelEntries(
  envEntries: Record<string, ModelEntry> | undefined,
  providers: ProviderDescriptor[],
): Record<string, ModelEntry> | undefined {
  const result: Record<string, ModelEntry> = { ...(envEntries ?? {}) };
  for (const provider of providers) {
    for (const model of provider.models) {
      if (!result[model.id]) {
        result[model.id] = {
          cmd: '',  // Empty cmd: Relay won't try to start this model
          name: model.name,
          ctx_size: model.ctx_size,
          multimodal: model.multimodal,
          thinking_levels: model.thinking_levels,
        };
      }
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
```

### File 4: Modify `src/profile.ts` — fall back to provider profile when model matches

Add to `activeProfile()`:
```typescript
  // Check discovered providers for per-model profile overrides
  if (modelName && config.providers?.length) {
    const providerProfile = profileForModel(config.providers, modelName);
    if (providerProfile) {
      // Merge: hardcoded profile provides defaults, provider profile overrides
      return {
        id: providerProfile.model_profile_id,
        name: profile.displayName, // still from hardcoded
        reasoningMode: providerProfile.reasoning_mode ?? config.reasoningMode,
        toolMode: providerProfile.tool_mode ?? config.toolMode,
        thinking: providerProfile.thinking_supported
          ? { supported: true, levels: providerProfile.thinking_levels ?? ['on', 'off'] }
          : { supported: false, levels: ['on', 'off'] },
        expectedContext: providerProfile.expected_context,
        recommendedSampling: {
          ...(profile.sampling ?? {}),
          ...(config.samplingDefaults ?? {}),
        },
        knownClientCompatibility: providerProfile.known_client_compatibility ?? [],
        knownFailureModes: providerProfile.known_failure_modes ?? [],
        recommendedAgentWorkflow: providerProfile.recommended_agent_workflow ?? [],
      };
    }
  }
```

### File 5: Add import to `src/openai/models.ts` — serve models from providers

In the `handleModels()` function, after checking `config.modelEntries`:
```typescript
  // Include models from discovered Sandr providers
  if (config.providers?.length) {
    for (const provider of config.providers) {
      for (const model of provider.models) {
        const existing = allModels.find((m) => m.id === model.id);
        if (existing) continue; // env config takes priority
        const caps: string[] = ['completion'];
        if (model.multimodal) caps.push('multimodal');
        allModels.push({
          id: model.name ?? model.id,
          object: 'model',
          created: 0,
          owned_by: provider.provider_id,
          capabilities: caps,
          meta: model.ctx_size ? { n_ctx: model.ctx_size } : undefined,
        });
      }
    }
  }
```

---

## Tests

### `tests/provider-discovery.test.ts`

```typescript
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

import { discoverProviders, findProviderForModel, profileForModel, upstreamForModel } from '../src/provider/discover.ts';
import { DEFAULT_PROVIDER_PATH } from '../src/provider/types.ts';

test('discoverProviders returns empty array when no provider directory exists', () => {
  const result = discoverProviders();
  // When RELAY_PROVIDER_PATH is unset and /etc/relay/providers doesn't exist,
  // discoverProviders should return [] without throwing.
  assert.ok(Array.isArray(result));
  // On a dev machine this will be empty unless the dir exists
});

test('discoverProviders loads a valid .provider.json from custom path', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'relay-test-'));
  process.env.RELAY_PROVIDER_PATH = tmpDir;

  const descriptor = {
    provider_id: 'test-provider',
    provider_name: 'Test Provider',
    provider_version: '0.1.0',
    models: [
      { id: 'test-model-v1', ctx_size: 32768, multimodal: false },
      { id: 'test-model-v2', ctx_size: 65536, multimodal: true },
    ],
    profile: {
      model_profile_id: 'qwen',
      reasoning_mode: 'off',
      tool_mode: 'auto',
    },
    upstream: {
      base_url: 'http://127.0.0.1:8080/v1',
    },
  };

  writeFileSync(join(tmpDir, 'test.provider.json'), JSON.stringify(descriptor));

  try {
    const providers = discoverProviders();
    assert.equal(providers.length, 1);
    assert.equal(providers[0].provider_id, 'test-provider');
    assert.equal(providers[0].models.length, 2);

    // Test findProviderForModel
    const found = findProviderForModel(providers, 'test-model-v1');
    assert.equal(found?.provider_id, 'test-provider');

    // Test case-insensitive lookup
    const caseInsensitive = findProviderForModel(providers, 'TEST-MODEL-V2');
    assert.equal(caseInsensitive?.provider_id, 'test-provider');

    // Test unknown model returns undefined
    const notFound = findProviderForModel(providers, 'nonexistent');
    assert.equal(notFound, undefined);

    // Test profileForModel
    const profile = profileForModel(providers, 'test-model-v1');
    assert.equal(profile?.model_profile_id, 'qwen');
    assert.equal(profile?.reasoning_mode, 'off');

    // Test upstreamForModel
    const upstream = upstreamForModel(providers, 'test-model-v2');
    assert.equal(upstream?.baseUrl, 'http://127.0.0.1:8080/v1');
  } finally {
    delete process.env.RELAY_PROVIDER_PATH;
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('discoverProviders skips invalid JSON files gracefully', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'relay-test-'));
  process.env.RELAY_PROVIDER_PATH = tmpDir;

  writeFileSync(join(tmpDir, 'valid.provider.json'), JSON.stringify({
    provider_id: 'valid',
    provider_name: 'Valid',
    provider_version: '1.0.0',
    models: [{ id: 'm1' }],
    profile: { model_profile_id: 'generic' },
    upstream: { base_url: 'http://localhost/v1' },
  }));
  writeFileSync(join(tmpDir, 'invalid.provider.json'), '{bad json');
  writeFileSync(join(tmpDir, 'not-a-provider.txt'), JSON.stringify({ irrelevant: true }));
  writeFileSync(join(tmpDir, 'missing-fields.json'), JSON.stringify({ foo: 'bar' }));

  try {
    const providers = discoverProviders();
    assert.equal(providers.length, 1);
    assert.equal(providers[0].provider_id, 'valid');
  } finally {
    delete process.env.RELAY_PROVIDER_PATH;
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('discoverProviders merges models from multiple providers', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'relay-test-'));
  process.env.RELAY_PROVIDER_PATH = tmpDir;

  writeFileSync(join(tmpDir, 'provider-a.provider.json'), JSON.stringify({
    provider_id: 'provider-a',
    provider_name: 'A',
    provider_version: '1.0.0',
    models: [
      { id: 'model-a1', ctx_size: 16384 },
      { id: 'model-a2', ctx_size: 32768 },
    ],
    profile: { model_profile_id: 'generic' },
    upstream: { base_url: 'http://localhost:8081/v1' },
  }));

  writeFileSync(join(tmpDir, 'provider-b.provider.json'), JSON.stringify({
    provider_id: 'provider-b',
    provider_name: 'B',
    provider_version: '2.0.0',
    models: [
      { id: 'model-b1', ctx_size: 65536, multimodal: true },
    ],
    profile: { model_profile_id: 'qwen' },
    upstream: { base_url: 'http://localhost:8082/v1' },
  }));

  try {
    const providers = discoverProviders();
    assert.equal(providers.length, 2);

    // Each provider's models are accessible
    const aModels = providers.find((p) => p.provider_id === 'provider-a')!.models;
    assert.equal(aModels.length, 2);

    const bModels = providers.find((p) => p.provider_id === 'provider-b')!.models;
    assert.equal(bModels.length, 1);

    // Cross-provider model lookup
    const foundA = findProviderForModel(providers, 'model-a1');
    assert.equal(foundA?.provider_id, 'provider-a');

    const foundB = findProviderForModel(providers, 'model-b1');
    assert.equal(foundB?.provider_id, 'provider-b');
  } finally {
    delete process.env.RELAY_PROVIDER_PATH;
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
```

### Running the tests

```bash
# On temper-inference:
cd ~/relay
RELAY_PROVIDER_PATH=/tmp/test-providers node --experimental-strip-types --test tests/provider-discovery.test.ts
```

---

## Code That Should Move to Sandr Later

This is the "bigger" split — once the shared contract is proven, these files move to the Sandr package:

| File | Why It Moves | Migration Order |
|------|-------------|-----------------|
| `src/profile.ts` | Hardcoded model family profiles ARE provider descriptors | **1st** — trivial: just export as provider.json |
| `src/lifecycle.ts` | Process management (start/kill/health probe/port allocate) is Sandr's job | **2nd** — Relay calls Sandr lifecycle API via HTTP or IPC |
| `src/capabilities.ts` | Probing model capabilities requires knowing runtime internals | **3rd** — Sandr exposes `/capabilities` endpoint, Relay proxies |
| `src/openai/models.ts` (model listing logic) | Model list comes from installed models, not Relay config | **After lifecycle** — Sandr serves `/v1/models` |
| `src/config.ts` (lifecycle/model fields) | `modelEntries`, `lazyModelEnabled`, `llamaStartCommand`, etc. | **With lifecycle move** |
| `src/upstream/llama.ts` (the non-generic parts) | Context-size error detection, upstream error parsing specific to llama.cpp | **With capabilities** |
| `scripts/doctor.ts` | Full system diagnostic is a Sandr tool | **After split** |
| `scripts/install.sh` | Model download, GPU config, start script generation | **After split** |
| `scripts/probe-gpu.sh` | GPU detection is Sandr's concern | **After split** |
| `Dockerfile` + `docker-compose.yml` (GPU parts) | GPU passthrough, llama.cpp mount, model volumes | **After split** |

### End-state architecture

```
┌─────────────┐    provider.json (JSON)    ┌──────────────────┐
│             │ ◄─────────────────────────  │                  │
│    Relay    │     /etc/relay/providers/   │      Sandr       │
│  (always-on │                             │  (model runtime) │
│   gateway)  │    HTTP (proxy to runtime)  │                  │
│             │ ◄─────────────────────────  │  llama.cpp       │
│             │     127.0.0.1:8080/v1       │  /dev/dri        │
└─────────────┘                             └──────────────────┘
```

Relay starts independently. If a Sandr `provider.json` exists in the discovery directory, Relay loads it and knows about those models. If not, Relay still starts and serves health/metrics endpoints.

Sandr is installed separately. It writes `provider.json`, manages model processes, and listens for HTTP requests from Relay.
