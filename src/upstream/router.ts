/**
 * Dynamic upstream router — resolves the correct upstream URL per model.
 *
 * Integrates with ModelLifecycle to route requests to the right port
 * when multiple models are running concurrently.
 */

import type { AppConfig } from '../config.ts';

/**
 * Resolve the upstream base URL for a request's model.
 *
 * When the lifecycle has a running process for the requested model,
 * routes to that model's dedicated port. Otherwise falls back to
 * the globally configured upstreamBaseUrl.
 */
export function resolveUpstreamUrl(
  config: AppConfig,
  lifecycle: { getUpstreamUrl(modelName?: string): string },
  modelName?: string,
): string {
  if (modelName) {
    const dynamicUrl = lifecycle.getUpstreamUrl(modelName);
    // If the lifecycle returned something different from the default,
    // use the dynamic URL
    if (dynamicUrl !== config.upstreamBaseUrl) {
      return dynamicUrl;
    }
  }
  return config.upstreamBaseUrl;
}

/**
 * Build a fetch-compatible URL from a base URL and path.
 */
export function upstreamUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  if (cleanBase.endsWith('/v1') && path.startsWith('/v1/')) {
    return `${cleanBase}${path.slice('/v1'.length)}`;
  }
  if (cleanBase.endsWith('/v1') && path === '/health') {
    return `${cleanBase.slice(0, -3)}/health`;
  }
  return `${cleanBase}${path}`;
}

export { upstreamUrl as buildUpstreamUrl };
