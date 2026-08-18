/**
 * Blocklist of revoked session ids, consulted on every authenticated request
 * (JEF-164).
 *
 * Access-token verification is otherwise fully stateless — `verifyAccess()`
 * checks signature and expiry only, with no DB lookup — so an access token
 * issued before a logout stays valid until its own natural 15-minute expiry
 * even though the session behind it is revoked. Recording the revoked `sid`
 * here (it's already a claim on every access token, so no new `jti` claim is
 * needed) lets `AuthenticateRequestUseCase` reject those tokens immediately.
 *
 * Implementations must **fail open** — treat a backing-store failure as "not
 * revoked" and allow the request. This is deliberately the same
 * graceful-degradation tradeoff `RedisCache`/`RedisRateLimiter` already make:
 * a Redis blip should degrade to "logout takes up to 15 minutes again," never
 * to "every request in the API is unauthenticated."
 */
export interface ISessionBlocklist {
  /** Blocklists `sessionId` for the remaining lifetime of any access token it issued. */
  revoke(sessionId: string): Promise<void>;
  /** True if `sessionId` has been revoked; false both when it hasn't been and when the check itself failed. */
  isRevoked(sessionId: string): Promise<boolean>;
}
