import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * In-process, fixed-window rate limiter. Suitable for a single Fastify
 * instance (no shared store) — buckets live in memory and are never
 * persisted, so limits reset on process restart and aren't shared across
 * horizontally-scaled instances.
 */
export class RateLimiter implements IRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly maxAttempts: number,
    private readonly windowMs: number,
  ) {}

  consume(key: string): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (bucket.count >= this.maxAttempts) return false;

    bucket.count += 1;
    return true;
  }
}
