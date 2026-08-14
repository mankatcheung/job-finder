import { Redis } from '@upstash/redis';
import { CACHE_PROVIDER, ENV } from '#src/constants.js';

let cached: Redis | null | undefined;

/**
 * Lazily constructs — and memoizes — the single shared Upstash Redis client
 * used by both RedisCache and RedisRateLimiter, so the two don't each open
 * their own separate client. Returns null when CACHE_PROVIDER isn't 'redis'
 * (the local dev/test default, where MemoryCache/RateLimiter are used
 * instead).
 *
 * Throws if CACHE_PROVIDER=redis but the required env vars are missing.
 * Validated eagerly (called at container-build time, not on first use):
 * cache and rate limiting both underlie nearly every request, so a
 * misconfiguration should fail fast at boot rather than silently on first
 * use — same reasoning RedisCache's own config validation already used.
 */
export function getRedisClient(): Redis | null {
  if (cached !== undefined) return cached;

  if (process.env[ENV.CACHE_PROVIDER] !== CACHE_PROVIDER.REDIS) {
    cached = null;
    return cached;
  }

  const url = process.env[ENV.UPSTASH_REDIS_REST_URL];
  const token = process.env[ENV.UPSTASH_REDIS_REST_TOKEN];
  if (!url || !token) {
    throw new Error(
      `${ENV.CACHE_PROVIDER}=${CACHE_PROVIDER.REDIS} requires both ${ENV.UPSTASH_REDIS_REST_URL} and ${ENV.UPSTASH_REDIS_REST_TOKEN}`,
    );
  }
  cached = new Redis({ url, token });
  return cached;
}
