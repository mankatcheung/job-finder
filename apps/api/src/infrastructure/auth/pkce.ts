import { createHash, randomBytes } from 'crypto';

/**
 * PKCE (RFC 7636) for the flows where trakwyn is the *client* — signing in
 * with Google or GitHub.
 *
 * The verifier stays on this server; only its SHA-256 hash travels through the
 * browser as the challenge. So an attacker who captures the whole callback URL
 * still cannot redeem the code, which is what protects against authorization
 * code injection (JEF-200).
 *
 * Note this runs the opposite direction to `matchesPkce` in
 * `ExchangeMcpOAuthAuthorizationCodeUseCase` — there trakwyn is the
 * authorization server *verifying* a challenge someone else minted.
 */

/** 32 random bytes → 43 base64url characters, inside RFC 7636's 43–128 range. */
const VERIFIER_BYTES = 32;

export function deriveCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function createPkcePair(): { verifier: string; challenge: string } {
  // base64url, so the result is already unreserved characters only — no
  // percent-encoding in the query string, and no '.' to collide with the
  // separator the state cookie uses.
  const verifier = randomBytes(VERIFIER_BYTES).toString('base64url');
  return { verifier, challenge: deriveCodeChallenge(verifier) };
}
