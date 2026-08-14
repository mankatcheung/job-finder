/**
 * The subset of `@upstash/redis`'s `Redis` client that RedisCache uses.
 * Kept narrow and separate from ICache so tests can inject a fake in-memory
 * implementation instead of hitting real Upstash infrastructure.
 */
export interface IRedisClient {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { nx?: true; px?: number }): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  scan(
    cursor: string | number,
    opts?: { match?: string; count?: number },
  ): Promise<[string, string[]]>;
}
