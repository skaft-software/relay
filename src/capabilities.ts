import type { AppConfig } from './config.ts';
import { activeProfile } from './profile.ts';

export type RelayCapabilityStatus = 'supported' | 'unsupported' | 'unknown';

export type RelayCapabilities = {
  upstream: {
    baseUrl: string;
    reachable: boolean;
    health: RelayCapabilityStatus;
    contextSize?: number;
  };
  models: {
    list: RelayCapabilityStatus;
    currentModel?: string;
  };
  endpoints: {
    chatCompletions: RelayCapabilityStatus;
    completions: RelayCapabilityStatus;
    responses: RelayCapabilityStatus;
    embeddings: RelayCapabilityStatus;
    anthropicMessages: RelayCapabilityStatus;
    tokenCounting: RelayCapabilityStatus;
    rerank: RelayCapabilityStatus;
  };
  features: {
    chatCompletions: RelayCapabilityStatus;
    tokenization: RelayCapabilityStatus;
    streaming: RelayCapabilityStatus;
    tools: RelayCapabilityStatus;
    parallelToolCalls: RelayCapabilityStatus;
    jsonSchema: RelayCapabilityStatus;
    responseFormat: RelayCapabilityStatus;
    multimodalInput: RelayCapabilityStatus;
    reasoningContent: RelayCapabilityStatus;
    logprobs: RelayCapabilityStatus;
  };
  profile: {
    id: string;
    name: string;
    reasoningMode: string;
    thinking: { supported: boolean; levels: string[] };
    toolMode: string;
    expectedContext?: {
      recommended: string;
      ceiling?: string;
      notes?: string;
    };
    recommendedSampling: Record<string, unknown>;
    knownClientCompatibility: string[];
    knownFailureModes: string[];
    recommendedAgentWorkflow: string[];
  };
  checkedAt: string;
};

export class CapabilityRegistry {
  private capabilities: RelayCapabilities;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
    this.capabilities = initialCapabilities(config);
  }

  get(): RelayCapabilities {
    return structuredClone(this.capabilities);
  }

  async refresh(externalSignal?: AbortSignal): Promise<RelayCapabilities> {
    const next = initialCapabilities(this.config);
    const modelProbe = await this.probe('/v1/models', { headers: { accept: 'application/json' } }, externalSignal);
    if (modelProbe.reachable) next.upstream.reachable = true;
    next.upstream.health = await this.probeHealth(externalSignal);
    if (modelProbe.response?.ok) {
      next.models.list = 'supported';
      const body = await modelProbe.response.json().catch(() => undefined);
      const firstModel = Array.isArray(body?.data) ? body.data.find((item: unknown) => isObject(item) && typeof item.id === 'string') : undefined;
      if (isObject(firstModel)) next.models.currentModel = firstModel.id;
    }

    const chatProbe = await this.probe('/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        model: next.models.currentModel ?? this.config.defaultModel ?? 'local',
        messages: [{ role: 'user', content: 'ping' }],
        // Endpoint/schema probe only. Do not treat this as a content-generation
        // health check for reasoning models; tiny budgets can yield no visible content.
        max_tokens: 1,
      }),
    }, externalSignal);
    if (chatProbe.reachable) next.upstream.reachable = true;
    next.features.chatCompletions = statusFromProbe(chatProbe);
    next.features.streaming = chatProbe.response?.ok ? 'supported' : 'unknown';

    const tokenizeProbe = await this.probe('/tokenize', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ content: 'ping' }),
    }, externalSignal);
    if (tokenizeProbe.reachable) next.upstream.reachable = true;
    next.features.tokenization = statusFromProbe(tokenizeProbe);
    next.endpoints.tokenCounting = statusFromProbe(tokenizeProbe);

    const embeddingsProbe = await this.probe('/v1/embeddings', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        model: next.models.currentModel ?? this.config.defaultModel ?? 'local',
        input: 'ping',
      }),
    }, externalSignal);
    if (embeddingsProbe.reachable) next.upstream.reachable = true;
    next.endpoints.embeddings = statusFromProbe(embeddingsProbe);

    const rerankProbe = await this.probe('/v1/rerank', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        model: next.models.currentModel ?? this.config.defaultModel ?? 'local',
        query: 'ping',
        documents: ['ping'],
        top_n: 1,
      }),
    }, externalSignal);
    if (rerankProbe.reachable) next.upstream.reachable = true;
    next.endpoints.rerank = statusFromProbe(rerankProbe);

    this.capabilities = next;
    return this.get();
  }

  private async probe(path: string, init: RequestInit, externalSignal?: AbortSignal): Promise<{ response?: Response; reachable: boolean }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.probeTimeoutMs ?? 3000);
    const signal = externalSignal ? AbortSignal.any([controller.signal, externalSignal]) : controller.signal;
    try {
      const response = await fetch(upstreamUrl(this.config.upstreamBaseUrl, path), {
        ...init,
        signal,
      });
      return {
        response,
        reachable: response.ok || response.status !== 404,
      };
    } catch {
      return { reachable: false };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async probeHealth(externalSignal?: AbortSignal): Promise<RelayCapabilityStatus> {
    const probe = await this.probe('/health', { headers: { accept: 'application/json' } }, externalSignal);
    if (probe.reachable && probe.response?.ok) return 'supported';
    if (probe.response?.status === 404) return 'unknown';
    return probe.reachable ? 'unknown' : 'unknown';
  }
}

function initialMultimodalStatus(config: AppConfig): RelayCapabilityStatus {
  if (!config.modelEntries) return config.upstreamVisionOk ? 'supported' : 'unknown';
  const currentModel = config.defaultModel;
  if (currentModel && config.modelEntries[currentModel]?.multimodal === true) return 'supported';
  if (currentModel && config.modelEntries[currentModel]?.multimodal === false) return 'unsupported';
  if (currentModel && config.modelEntries[currentModel]) return config.upstreamVisionOk ? 'supported' : 'unsupported';
  return config.upstreamVisionOk ? 'supported' : 'unknown';
}

function initialCapabilities(config: AppConfig): RelayCapabilities {
  return {
    upstream: {
      baseUrl: config.upstreamBaseUrl,
      reachable: false,
      health: 'unknown',
      contextSize: defaultModelCtxSize(config),
    },
    models: {
      list: 'unknown',
      currentModel: config.defaultModel,
    },
    endpoints: {
      chatCompletions: 'supported',
      completions: 'supported',
      responses: 'supported',
      embeddings: 'unknown',
      anthropicMessages: 'supported',
      tokenCounting: 'unknown',
      rerank: 'unknown',
    },
    features: {
      chatCompletions: 'unknown',
      tokenization: 'unknown',
      streaming: 'unknown',
      tools: 'unknown',
      parallelToolCalls: 'unknown',
      jsonSchema: 'unknown',
      responseFormat: 'unknown',
      multimodalInput: initialMultimodalStatus(config),
      reasoningContent: 'unknown',
      logprobs: 'unknown',
    },
    profile: activeProfile(config),
    checkedAt: new Date().toISOString(),
  };
}

function statusFromProbe(probe: { response?: Response }): RelayCapabilityStatus {
  if (probe.response?.ok) return 'supported';
  if (probe.response && (probe.response.status === 404 || probe.response.status === 501)) return 'unsupported';
  return 'unknown';
}

function upstreamUrl(baseUrl: string, path: string): string {
  if (baseUrl.endsWith('/v1') && path.startsWith('/v1/')) {
    return `${baseUrl}${path.slice('/v1'.length)}`;
  }
  return `${baseUrl}${path}`;
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function defaultModelCtxSize(config: AppConfig): number | undefined {
  if (config.defaultModel && config.modelEntries) {
    const entry = config.modelEntries[config.defaultModel];
    if (entry?.ctx_size) return entry.ctx_size;
  }
  return config.upstreamCtxSize;
}
