/**
 * Cache-aside port implemented by both MemoryCache (per-instance, dev/test)
 * and RedisCache (shared across instances, production — see JEF-127).
 *
 * There's a single read primitive, `getOrSet`, rather than separate
 * `get`/`set` methods: every read-through call site in this codebase always
 * follows a miss with a set of the same fetched value, and folding that into
 * one method is what lets an implementation guard against cache stampedes
 * (only one caller actually invokes `fetch` on a miss; concurrent callers
 * for the same key wait for its result instead of all hitting the DB).
 */
export interface ICache {
  getOrSet<T>(key: string, fetch: () => Promise<T>, ttlMs?: number): Promise<T>;
  delete(key: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<void>;
}
