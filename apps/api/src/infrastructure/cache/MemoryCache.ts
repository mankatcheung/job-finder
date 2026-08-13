import { CACHE } from '#src/constants.js';
import type { ICache } from './ICache.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Per-process, in-memory implementation of ICache. Used for local dev and
 * tests. Not coherent across multiple processes/instances — that's what
 * RedisCache is for in production (see JEF-127).
 */
export class MemoryCache implements ICache {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  // Single-flight: concurrent getOrSet calls for the same key on a miss
  // share one in-flight fetch instead of each hitting the DB. This is the
  // in-process analogue of RedisCache's distributed lock — it doesn't help
  // across instances, but it's free and correctness never hurts.
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly ttlMs: number;

  constructor(ttlMs = CACHE.DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  async getOrSet<T>(key: string, fetch: () => Promise<T>, ttlMs = this.ttlMs): Promise<T> {
    const entry = this.store.get(key);
    if (entry) {
      if (Date.now() <= entry.expiresAt) return entry.value as T;
      this.store.delete(key);
    }

    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    const promise = fetch()
      .then((value) => {
        this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });
    this.inFlight.set(key, promise);
    return promise;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  /** Removes all entries whose key starts with the given prefix. */
  async deleteByPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  /** Test-only convenience — not part of ICache (Redis has no cheap equivalent). */
  clear(): void {
    this.store.clear();
  }

  /** Test-only convenience — not part of ICache (Redis has no cheap equivalent). */
  get size(): number {
    return this.store.size;
  }
}
