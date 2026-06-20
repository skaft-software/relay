import type { AppConfig, CloudModelEntry } from './config.ts';

export type ResolvedCloudModel = {
  base_url: string;
  authHeader: string;
  ctx_size?: number;
};

/**
 * Registry of cloud API models loaded from RELAY_CLOUD_MODELS.
 * Resolves env vars at construction time so API keys are never
 * stored in log output or observability payloads.
 */
export class CloudModelRegistry {
  private models = new Map<string, ResolvedCloudModel>();

  constructor(config: AppConfig) {
    if (!config.cloudModels) return;

    for (const [name, entry] of Object.entries(config.cloudModels)) {
      const apiKey = process.env[entry.auth_env];
      if (!apiKey) {
        // Warn on startup but don't crash — the model just won't be
        // routable until the env var is set.
        console.warn(
          `[cloud] model "${name}" requires ${entry.auth_env} but it is not set — skipping`
        );
        continue;
      }

      this.models.set(name.toLowerCase(), {
        base_url: entry.base_url,
        authHeader: `Bearer ${apiKey}`,
        ctx_size: entry.ctx_size,
      });
    }
  }

  /**
   * Resolve a model name (case-insensitive) to its cloud upstream config.
   * Returns undefined if the model is not a known cloud model.
   */
  resolve(modelName: string): ResolvedCloudModel | undefined {
    return this.models.get(modelName.toLowerCase());
  }

  /**
   * List all registered cloud model names.
   */
  listNames(): string[] {
    return [...this.models.keys()];
  }

  /**
   * Number of registered cloud models with valid auth.
   */
  get size(): number {
    return this.models.size;
  }

  /**
   * Build an upstream options object suitable for passing to LLM handlers.
   * Returns undefined if the model is unknown.
   */
  upstreamOptionsFor(
    modelName: string
  ): { baseUrl?: string; authHeader?: string; ctxSize?: number } | undefined {
    const model = this.resolve(modelName);
    if (!model) return undefined;
    return {
      baseUrl: model.base_url,
      authHeader: model.authHeader,
      ctxSize: model.ctx_size,
    };
  }
}
