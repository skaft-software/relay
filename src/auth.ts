import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time API key comparison against any of the candidate values.
 * Returns false when no key is configured (unauthenticated mode).
 */
export function hasValidApiKey(configuredKey: string | undefined, ...candidates: Array<string | null | undefined>): boolean {
  if (!configuredKey) return false;
  const expected = digest(configuredKey);
  return candidates.some((candidate) => typeof candidate === 'string' && timingSafeEqual(digest(candidate), expected));
}

/**
 * Per-key sliding-window rate limiter.
 *
 * Each unique API key or bearer token gets its own independent token bucket.
 * This means Alice can hand out her relay URL and token to Bob without Bob's
 * usage eating into Alice's rate limit — each key is tracked separately.
 *
 * Falls back to IP-based limiting when no API key is present in the request.
 */
export class KeyRateLimiter {
  private readonly max: number;
  private readonly windowMs: number;
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(max: number, windowMs: number) {
    this.max = max;
    this.windowMs = windowMs;
  }

  /**
   * Check and record a request for the given key.
   * Returns true if the request is allowed, false if rate-limited.
   */
  allow(key: string): boolean {
    this.prune();
    const now = Date.now();
    const entry = this.buckets.get(key);
    if (!entry || now >= entry.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    if (entry.count >= this.max) return false;
    entry.count += 1;
    return true;
  }

  private prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.buckets) {
      if (now >= entry.resetAt) this.buckets.delete(key);
    }
  }
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}
