import { REAUTH } from '#src/constants.js';

/**
 * `authTime` is the epoch-ms of a session's last full authentication (login
 * or step-up reauth). `null` means the check doesn't apply — API-token auth
 * has no session/freshness concept, so it's always treated as fresh.
 * `undefined` means a JWT session that predates the `authTime` claim
 * (JEF-44) — treated as maximally stale so it self-heals on first use.
 */
export function isSessionFresh(authTime: number | null | undefined): boolean {
  if (authTime === null) return true;
  if (authTime === undefined) return false;
  return Date.now() - authTime <= REAUTH.FRESHNESS_WINDOW_MS;
}
