import type { JwtUser } from '#src/http/context.js';

/**
 * `null` skips the step-up freshness check entirely (API-token auth has no
 * session/freshness concept); a JWT session with no `authTime` claim (issued
 * before JEF-44) falls through as `undefined`, which is treated as stale.
 */
export function sessionAuthTime(user: JwtUser): number | null | undefined {
  return user.sid ? user.authTime : null;
}
