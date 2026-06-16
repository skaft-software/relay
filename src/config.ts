export type ModelEntry = {
  /** Shell command or script to start this model */
  cmd: string;
  /** Optional health URL (defaults to probing upstreamBaseUrl) */
  health_url?: string;
  /** Startup timeout in seconds (defaults to modelStartTimeoutMs / 1000) */
  timeout_sec?: number;
  /** Display name reported to clients (defaults to key) */
  name?: string;
  /** Running context size for this model (--ctx-size). Overrides global UPSTREAM_CTX_SIZE for model list and capabilities. */
  ctx_size?: number;
  /** Whether this model supports multimodal (vision/audio) input. When unset, falls back to upstreamVisionOk. */
  multimodal?: boolean;
  /** Fixed port for this model's upstream server. Auto-allocated if unset. */
  port?: number;
  /** Pre-warm this model with cached conversation prefixes on switch. */
  prewarm?: boolean;
  /** Grace period in ms to keep old model alive after switch. */
  switchGraceMs?: number;
};

export type AppConfig = {
  port: number;
  host: string;
  upstreamBaseUrl: string;
  defaultModel?: string;
  samplingDefaults: SamplingDefaults;
  requestTimeoutMs: number;
  logLevel: string;
  apiKey?: string;
  completionTtlMs: number;
  upstreamVisionOk?: boolean;
  maxRequestBodyBytes: number;
  probeOnStartup: boolean;
  strictStartup: boolean;
  probeTimeoutMs: number;
  unknownFieldPolicy: UnknownFieldPolicy;
  strictCompat: boolean;
  warnOnStrippedFields: boolean;
  modelProfile: RelayModelProfileId;
  reasoningMode: RelayReasoningMode;
  toolMode: RelayToolMode;
  thinkingSupported?: boolean;
  thinkingLevels?: string[];
  observabilityEnabled: boolean;
  logPrompts: boolean;
  requestHistoryLimit: number;
  upstreamCtxSize?: number;
  corsOrigin?: string;
  rateLimitAuthMax?: number;
  rateLimitAuthWindowMs?: number;
  exposeUpstreamErrors?: boolean;
  observabilityCaptureBody?: boolean;
  allowedHosts?: string[];
  maxStoreEntries: number;
  trustProxy: boolean;
  maxUpstreamResponseBytes: number;
  lazyModelEnabled?: boolean;
  llamaStartCommand?: string;
  llamaStopCommand?: string;
  llamaIdleShutdownMs?: number;
  modelHealthUrl?: string;
  modelStartTimeoutMs?: number;
  jobQueueMaxPending?: number;
  jobTtlMs?: number;
  shutdownTimeoutMs?: number;
  modelStartArgv?: string[];
  modelShutdownArgv?: string[];
  lifecycleCircuitBreakerThreshold?: number;
  lifecycleCircuitBreakerWindowMs?: number;
  lifecycleCircuitBreakerCooldownMs?: number;
  lifecycleRingBufferBytes?: number;
  lifecycleShutdownConfirmTimeoutMs?: number;
  maxStoreBytes?: number;
  rateLimitRelayPostMax?: number;
  rateLimitRelayPostWindowMs?: number;
  /** When true, serialize all LLM requests so exactly one runs at a time.
   *  First caller gets zero-latency passthrough; simultaneous callers queue FCFS. */
  serializeRequests?: boolean;
  /** Mapping of model names (as clients request them) to start configs.
   *  When a client requests a model in this map, the lifecycle will
   *  automatically switch to it if the current model differs. */
  modelEntries?: Record<string, ModelEntry>;
  /** Switch policy: graceful keeps old model warm, eager kills first. */
  switchPolicy: 'graceful' | 'eager';
  /** Starting port number for dynamic model port allocation. */
  modelPortBase: number;
  /** Enable prompt-cache pre-warming when switching models. */
  switchPrewarm: boolean;
  /** Maximum number of concurrent model processes to keep warm. */
  switchMaxWarmModels: number;
  /** Prefix cache: max number of cached conversation prefixes. */
  prefixCacheMaxEntries: number;
  /** Prefix cache: max combined size of cached prefixes in tokens. */
  prefixCacheMaxTokens: number;
};

export type UnknownFieldPolicy = 'pass_through' | 'strip' | 'reject';
export type RelayModelProfileId =
  | 'generic'
  | 'qwen'
  | 'deepseek'
  | 'gemma'
  | 'mistral'
  | 'llama'
  | 'kimi'
  | 'openai_compatible'
  | 'anthropic_compatible';
export type RelayReasoningMode = 'off' | 'raw' | 'parsed' | 'preserve';
export type RelayToolMode = 'auto' | 'native' | 'generic' | 'off';

export type SamplingDefaults = {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  min_p?: number;
  presence_penalty?: number;
  repeat_penalty?: number;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: readInteger(env.PORT, 1234, 'PORT'),
    host: readString(env.HOST, '127.0.0.1'),
    upstreamBaseUrl: trimTrailingSlash(readString(env.UPSTREAM_BASE_URL, 'http://127.0.0.1:8080/v1')),
    defaultModel: readOptional(env.DEFAULT_MODEL),
    samplingDefaults: readSamplingDefaults(env),
    requestTimeoutMs: readInteger(env.REQUEST_TIMEOUT_SECONDS, 600, 'REQUEST_TIMEOUT_SECONDS') * 1000,
    logLevel: readString(env.LOG_LEVEL, 'info'),
    apiKey: readOptional(env.API_KEY),
    completionTtlMs: readInteger(env.COMPLETION_TTL_SECONDS, 3600, 'COMPLETION_TTL_SECONDS') * 1000,
    upstreamVisionOk: env.UPSTREAM_VISION_OK === 'true',
    maxRequestBodyBytes: readInteger(env.MAX_REQUEST_BODY_BYTES, 1_048_576, 'MAX_REQUEST_BODY_BYTES'),
    probeOnStartup: readBoolean(env.RELAY_PROBE_ON_STARTUP, true),
    strictStartup: readBoolean(env.RELAY_STRICT_STARTUP, false),
    probeTimeoutMs: readInteger(env.RELAY_PROBE_TIMEOUT_MS, 3000, 'RELAY_PROBE_TIMEOUT_MS'),
    unknownFieldPolicy: readUnknownFieldPolicy(env.RELAY_UNKNOWN_FIELD_POLICY),
    strictCompat: readBoolean(env.RELAY_STRICT_COMPAT, false),
    warnOnStrippedFields: readBoolean(env.RELAY_WARN_ON_STRIPPED_FIELDS, true),
    modelProfile: readModelProfile(env.RELAY_MODEL_PROFILE),
    reasoningMode: readReasoningMode(env.RELAY_REASONING_MODE),
    toolMode: readToolMode(env.RELAY_TOOL_MODE),
    thinkingSupported: readBoolean(env.RELAY_THINKING_SUPPORTED, false),
    thinkingLevels: readList(env.RELAY_THINKING_LEVELS, ['on', 'off']),
    observabilityEnabled: readBoolean(env.RELAY_OBSERVABILITY_ENABLED, true),
    logPrompts: readBoolean(env.RELAY_LOG_PROMPTS, false),
    requestHistoryLimit: readInteger(env.RELAY_REQUEST_HISTORY_LIMIT, 100, 'RELAY_REQUEST_HISTORY_LIMIT'),
    upstreamCtxSize: readOptionalNumber(env.UPSTREAM_CTX_SIZE, 'UPSTREAM_CTX_SIZE'),
    corsOrigin: readOptional(env.CORS_ORIGIN),
    rateLimitAuthMax: readInteger(env.RATE_LIMIT_AUTH_MAX, 20, 'RATE_LIMIT_AUTH_MAX'),
    rateLimitAuthWindowMs: readInteger(env.RATE_LIMIT_AUTH_WINDOW_SECONDS, 60, 'RATE_LIMIT_AUTH_WINDOW_SECONDS') * 1000,
    exposeUpstreamErrors: readBoolean(env.RELAY_EXPOSE_UPSTREAM_ERRORS, false),
    observabilityCaptureBody: readBoolean(env.RELAY_OBSERVABILITY_CAPTURE_BODY, false),
    allowedHosts: readList(env.RELAY_ALLOWED_HOSTS, []),
    maxStoreEntries: readInteger(env.MAX_STORE_ENTRIES, 1000, 'MAX_STORE_ENTRIES'),
    trustProxy: readBoolean(env.TRUST_PROXY, false),
    maxUpstreamResponseBytes: readInteger(env.MAX_UPSTREAM_RESPONSE_BYTES, 16_777_216, 'MAX_UPSTREAM_RESPONSE_BYTES'),
    lazyModelEnabled: readBoolean(
      env.RELAY_MODEL_LIFECYCLE_ENABLED ?? env.RELAY_LAZY_MODEL_ENABLED,
      false,
    ),
    llamaStartCommand: readOptional(env.RELAY_MODEL_START_COMMAND ?? env.LLAMA_START_COMMAND),
    llamaStopCommand: readOptional(env.RELAY_MODEL_SHUTDOWN_COMMAND ?? env.LLAMA_STOP_COMMAND),
    llamaIdleShutdownMs: readIdleShutdownMs(env),
    modelHealthUrl: readOptional(env.RELAY_MODEL_HEALTH_URL),
    modelStartTimeoutMs: readInteger(env.RELAY_MODEL_START_TIMEOUT_MS, 120_000, 'RELAY_MODEL_START_TIMEOUT_MS'),
    jobQueueMaxPending: readInteger(env.RELAY_JOB_QUEUE_MAX_PENDING, 100, 'RELAY_JOB_QUEUE_MAX_PENDING'),
    jobTtlMs: readInteger(env.RELAY_JOB_TTL_SECONDS, 3600, 'RELAY_JOB_TTL_SECONDS') * 1000,
    shutdownTimeoutMs: readInteger(env.RELAY_SHUTDOWN_TIMEOUT_MS, 30_000, 'RELAY_SHUTDOWN_TIMEOUT_MS'),
    modelStartArgv: readJsonArray(env.RELAY_MODEL_START_ARGV),
    modelShutdownArgv: readJsonArray(env.RELAY_MODEL_SHUTDOWN_ARGV),
    lifecycleCircuitBreakerThreshold: readInteger(env.RELAY_LIFECYCLE_CIRCUIT_BREAKER_THRESHOLD, 3, 'RELAY_LIFECYCLE_CIRCUIT_BREAKER_THRESHOLD'),
    lifecycleCircuitBreakerWindowMs: readInteger(env.RELAY_LIFECYCLE_CIRCUIT_BREAKER_WINDOW_MS, 300_000, 'RELAY_LIFECYCLE_CIRCUIT_BREAKER_WINDOW_MS'),
    lifecycleCircuitBreakerCooldownMs: readInteger(env.RELAY_LIFECYCLE_CIRCUIT_BREAKER_COOLDOWN_MS, 120_000, 'RELAY_LIFECYCLE_CIRCUIT_BREAKER_COOLDOWN_MS'),
    lifecycleRingBufferBytes: readInteger(env.RELAY_LIFECYCLE_RING_BUFFER_BYTES, 65536, 'RELAY_LIFECYCLE_RING_BUFFER_BYTES'),
    lifecycleShutdownConfirmTimeoutMs: readInteger(env.RELAY_LIFECYCLE_SHUTDOWN_CONFIRM_TIMEOUT_MS, 10_000, 'RELAY_LIFECYCLE_SHUTDOWN_CONFIRM_TIMEOUT_MS'),
    maxStoreBytes: readOptionalNumber(env.MAX_STORE_BYTES, 'MAX_STORE_BYTES'),
    rateLimitRelayPostMax: readInteger(env.RATE_LIMIT_RELAY_POST_MAX, 50, 'RATE_LIMIT_RELAY_POST_MAX'),
    rateLimitRelayPostWindowMs: readInteger(env.RATE_LIMIT_RELAY_POST_WINDOW_SECONDS, 60, 'RATE_LIMIT_RELAY_POST_WINDOW_SECONDS') * 1000,
    serializeRequests: readBoolean(env.RELAY_SERIALIZE_REQUESTS, true),
    modelEntries: readModelEntries(env.RELAY_MODEL_MAP),
    switchPolicy: readSwitchPolicy(env.RELAY_SWITCH_POLICY),
    modelPortBase: readInteger(env.RELAY_MODEL_PORT_BASE, 8081, 'RELAY_MODEL_PORT_BASE'),
    switchPrewarm: readBoolean(env.RELAY_SWITCH_PREWARM, true),
    switchMaxWarmModels: readInteger(env.RELAY_SWITCH_MAX_WARM_MODELS, 2, 'RELAY_SWITCH_MAX_WARM_MODELS'),
    prefixCacheMaxEntries: readInteger(env.RELAY_PREFIX_CACHE_MAX_ENTRIES, 50, 'RELAY_PREFIX_CACHE_MAX_ENTRIES'),
    prefixCacheMaxTokens: readInteger(env.RELAY_PREFIX_CACHE_MAX_TOKENS, 1_000_000, 'RELAY_PREFIX_CACHE_MAX_TOKENS'),
  };
}


function readSwitchPolicy(value: string | undefined): 'graceful' | 'eager' {
  const raw = readOptional(value) ?? 'eager'  // eager is safe for single-GPU; graceful needs 2x VRAM;
  if (raw === 'graceful' || raw === 'eager') return raw;
  throw new Error('RELAY_SWITCH_POLICY must be graceful or eager');
}

function readIdleShutdownMs(env: NodeJS.ProcessEnv): number {
  const directMs = readOptional(env.RELAY_MODEL_IDLE_SHUTDOWN_MS);
  if (directMs) {
    const parsed = Number.parseInt(directMs, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error('RELAY_MODEL_IDLE_SHUTDOWN_MS must be a positive integer');
    }
    return parsed;
  }
  return readInteger(env.LLAMA_IDLE_SHUTDOWN_SECONDS, 600, 'LLAMA_IDLE_SHUTDOWN_SECONDS') * 1000;
}

function readSamplingDefaults(env: NodeJS.ProcessEnv): SamplingDefaults {
  const defaults: SamplingDefaults = {};
  assignOptionalNumber(defaults, 'temperature', env.DEFAULT_TEMPERATURE, 'DEFAULT_TEMPERATURE');
  assignOptionalNumber(defaults, 'top_p', env.DEFAULT_TOP_P, 'DEFAULT_TOP_P');
  assignOptionalNumber(defaults, 'top_k', env.DEFAULT_TOP_K, 'DEFAULT_TOP_K');
  assignOptionalNumber(defaults, 'min_p', env.DEFAULT_MIN_P, 'DEFAULT_MIN_P');
  assignOptionalNumber(defaults, 'presence_penalty', env.DEFAULT_PRESENCE_PENALTY, 'DEFAULT_PRESENCE_PENALTY');
  assignOptionalNumber(defaults, 'repeat_penalty', env.DEFAULT_REPETITION_PENALTY, 'DEFAULT_REPETITION_PENALTY');
  return defaults;
}

function assignOptionalNumber<T extends keyof SamplingDefaults>(
  defaults: SamplingDefaults,
  key: T,
  value: string | undefined,
  name: string,
): void {
  const parsed = readOptionalNumber(value, name);
  if (parsed !== undefined) defaults[key] = parsed;
}

function readOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readString(value: string | undefined, fallback: string): string {
  return readOptional(value) ?? fallback;
}

function readInteger(value: string | undefined, fallback: number, name: string): number {
  const raw = readOptional(value);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  const raw = readOptional(value);
  if (!raw) return fallback;
  return raw.toLowerCase() === 'true';
}

function readList(value: string | undefined, fallback: string[]): string[] {
  const raw = readOptional(value);
  if (!raw) return fallback;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function readUnknownFieldPolicy(value: string | undefined): UnknownFieldPolicy {
  const raw = readOptional(value) ?? 'pass_through';
  if (raw === 'pass_through' || raw === 'strip' || raw === 'reject') return raw;
  throw new Error('RELAY_UNKNOWN_FIELD_POLICY must be pass_through, strip, or reject');
}

function readModelProfile(value: string | undefined): RelayModelProfileId {
  const raw = readOptional(value) ?? 'generic';
  if ([
    'generic',
    'qwen',
    'deepseek',
    'gemma',
    'mistral',
    'llama',
    'kimi',
    'openai_compatible',
    'anthropic_compatible',
  ].includes(raw)) {
    return raw as RelayModelProfileId;
  }
  throw new Error('RELAY_MODEL_PROFILE must be one of generic, qwen, deepseek, gemma, mistral, llama, kimi, openai_compatible, anthropic_compatible');
}

function readReasoningMode(value: string | undefined): RelayReasoningMode {
  const raw = readOptional(value) ?? 'off';
  if (raw === 'off' || raw === 'raw' || raw === 'parsed' || raw === 'preserve') return raw;
  throw new Error('RELAY_REASONING_MODE must be off, raw, parsed, or preserve');
}

function readToolMode(value: string | undefined): RelayToolMode {
  const raw = readOptional(value) ?? 'auto';
  if (raw === 'auto' || raw === 'native' || raw === 'generic' || raw === 'off') return raw;
  throw new Error('RELAY_TOOL_MODE must be auto, native, generic, or off');
}

function readJsonArray(value: string | undefined): string[] | undefined {
  const raw = readOptional(value);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item): item is string => typeof item === 'string')) {
      return parsed;
    }
  } catch {
    // not valid JSON, fall through to undefined
  }
  return undefined;
}

function readOptionalNumber(value: string | undefined, name: string): number | undefined {
  const raw = readOptional(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be a finite number`);
  }
  return parsed;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function readModelEntries(value: string | undefined): Record<string, ModelEntry> | undefined {
  const raw = readOptional(value);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const entries: Record<string, ModelEntry> = {};
      for (const [key, entry] of Object.entries(parsed)) {
        if (entry && typeof entry === 'object' && typeof (entry as any).cmd === 'string') {
          entries[key] = entry as ModelEntry;
        }
      }
      if (Object.keys(entries).length > 0) return entries;
    }
  } catch {
    // invalid JSON, fall through
  }
  return undefined;
}

/**
 * Check whether a given model supports multimodal input.
 *
 * Resolution order:
 * 1. Per-model `multimodal` flag in modelEntries (explicit opt-in/opt-out)
 * 2. Global `upstreamVisionOk` config flag (backward compat)
 */
export function isModelMultimodal(config: AppConfig, model?: string): boolean {
  if (model && config.modelEntries?.[model]?.multimodal === true) return true;
  if (model && config.modelEntries?.[model]?.multimodal === false) return false;
  return config.upstreamVisionOk ?? false;
}
