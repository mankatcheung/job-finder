import type { ICache } from './ICache.js';
import { otelMetrics, type IMetrics } from '#src/infrastructure/observability/metrics.js';

interface Deps {
  inner: ICache;
  metrics?: IMetrics;
}

/**
 * Records cache hit/miss counters around any ICache (JEF-129).
 *
 * Deliberately a decorator at the port boundary rather than counters inside
 * MemoryCache/RedisCache: both implementations are then measured identically,
 * so a hit rate observed locally means the same thing as one observed in
 * production — and neither implementation has to carry observability
 * concerns it would otherwise duplicate.
 *
 * **How hit vs. miss is determined:** `getOrSet` returns a value either way,
 * so the outcome isn't visible in its result. Instead the caller's `fetch`
 * callback is wrapped, and its invocation is the signal — the underlying
 * fetch runs on a miss and is skipped on a hit, which is precisely the
 * distinction worth measuring (did this call cost a DB round-trip?).
 *
 * A single `getOrSet` counts at most one miss even if the inner cache
 * invokes `fetch` more than once (RedisCache can, in the rare case where
 * `fetch` succeeded but the write-back to Redis then failed) — one caller
 * request is one hit-or-miss.
 *
 * Note: expiry is *not* counted separately from miss. RedisCache genuinely
 * cannot distinguish them — an expired Redis key is simply absent on GET —
 * so an expiry counter would be measurable in dev and permanently zero in
 * production, which is worse than not having it.
 */
export class InstrumentedCache implements ICache {
  private readonly inner: ICache;
  private readonly metrics: IMetrics;

  constructor({ inner, metrics = otelMetrics }: Deps) {
    this.inner = inner;
    this.metrics = metrics;
  }

  async getOrSet<T>(key: string, fetch: () => Promise<T>, ttlMs?: number): Promise<T> {
    let fetched = false;
    const value = await this.inner.getOrSet(
      key,
      () => {
        fetched = true;
        return fetch();
      },
      ttlMs,
    );

    if (fetched) this.metrics.recordCacheMiss();
    else this.metrics.recordCacheHit();

    return value;
  }

  delete(key: string): Promise<void> {
    return this.inner.delete(key);
  }

  deleteByPrefix(prefix: string): Promise<void> {
    return this.inner.deleteByPrefix(prefix);
  }
}
