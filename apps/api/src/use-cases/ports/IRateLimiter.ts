export interface IRateLimiter {
  /** Resolves true if the request identified by `key` is allowed, false if it should be rejected. */
  consume(key: string): Promise<boolean>;
}
