export interface IRateLimiter {
  /** Returns true if the request identified by `key` is allowed, false if it should be rejected. */
  consume(key: string): boolean;
}
