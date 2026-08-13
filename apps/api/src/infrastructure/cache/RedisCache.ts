import { CACHE } from '#src/constants.js';
import type { ICache } from './ICache.js';
import type { IRedisClient } from './IRedisClient.js';

/**
 * Cached values are wrapped in `{ v }` rather than stored raw. Upstash's GET
 * returns `null` both when a key is absent AND when the stored JSON value is
 * literally `null` — wrapping lets RedisCache tell "never cached" apart from
 * "cached, and the answer is null" (e.g. findById caching a genuine
 * not-found result), which several Cached*Repository callers rely on.
 */
interface Envelope<T> {
  v: T;
}

interface Deps {
  redis: IRedisClient;
  lockTtlMs?: number;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Redis-backed ICache, shared across every serverless instance — fixes the
 * cross-instance invalidation gap a per-instance MemoryCache has on Vercel
 * (JEF-127).
 *
 * getOrSet also guards against cache stampedes: on a miss, only the caller
 * that wins a short-lived NX lock actually calls `fetch`. Concurrent misses
 * for the same key (whether on this instance or another — the lock lives in
 * Redis, not in process memory) poll briefly for the winner's result instead
 * of every one of them hitting the DB at once. If the winner doesn't finish
 * within the poll budget (e.g. it crashed mid-fetch, or is just slow), a
 * waiter falls back to fetching directly itself rather than waiting forever
 * — accepting a small chance of a couple of duplicate fetches in that rare
 * case, which is still far better than the unmitigated thundering herd this
 * replaces.
 */
export class RedisCache implements ICache {
  private readonly redis: IRedisClient;
  private readonly lockTtlMs: number;
  private readonly pollIntervalMs: number;
  private readonly maxPollAttempts: number;

  constructor({
    redis,
    lockTtlMs = CACHE.STAMPEDE_LOCK_TTL_MS,
    pollIntervalMs = CACHE.STAMPEDE_POLL_INTERVAL_MS,
    maxPollAttempts = CACHE.STAMPEDE_MAX_POLL_ATTEMPTS,
  }: Deps) {
    this.redis = redis;
    this.lockTtlMs = lockTtlMs;
    this.pollIntervalMs = pollIntervalMs;
    this.maxPollAttempts = maxPollAttempts;
  }

  async getOrSet<T>(
    key: string,
    fetch: () => Promise<T>,
    ttlMs = CACHE.DEFAULT_TTL_MS,
  ): Promise<T> {
    const hit = await this.redis.get<Envelope<T>>(key);
    if (hit !== null) return hit.v;

    const lockKey = `lock:${key}`;
    const acquired = await this.redis.set(lockKey, '1', { nx: true, px: this.lockTtlMs });

    if (acquired !== null) {
      try {
        const value = await fetch();
        await this.redis.set(key, { v: value } satisfies Envelope<T>, { px: ttlMs });
        return value;
      } finally {
        await this.redis.del(lockKey);
      }
    }

    for (let i = 0; i < this.maxPollAttempts; i++) {
      await sleep(this.pollIntervalMs);
      const retry = await this.redis.get<Envelope<T>>(key);
      if (retry !== null) return retry.v;
    }

    // The lock-holder didn't finish in time — fetch directly rather than
    // waiting forever, and still populate the cache for the next reader.
    const value = await fetch();
    await this.redis.set(key, { v: value } satisfies Envelope<T>, { px: ttlMs });
    return value;
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * No native "delete by prefix" in Redis — walks the keyspace with SCAN
   * (cursor-based, non-blocking) matching `${prefix}*` and deletes matches
   * in batches. Fine at this app's scale; would need a per-prefix key-set
   * index instead if the keyspace ever grew large enough for a full SCAN
   * pass to become expensive.
   */
  async deleteByPrefix(prefix: string): Promise<void> {
    let cursor: string | number = '0';
    do {
      const [next, keys] = await this.redis.scan(cursor, { match: `${prefix}*`, count: 100 });
      if (keys.length > 0) await this.redis.del(...keys);
      cursor = next;
    } while (cursor !== '0');
  }
}
