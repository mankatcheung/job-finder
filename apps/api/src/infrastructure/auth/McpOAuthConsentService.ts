import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { MCP_OAUTH } from '#src/use-cases/constants.js';
import { ENV } from '#src/infrastructure/config/constants.js';

/** The authorization request a consent decision is bound to. */
export interface McpConsentSubject {
  userId: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  codeChallenge: string;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function equals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Signs and verifies the short-lived token that proves a consent POST came
 * from a consent screen the user was actually shown.
 *
 * Why this exists: `POST /oauth/authorize/approve` authenticates from the
 * session cookie, which is `SameSite=None` in production, so the browser
 * attaches it to cross-site requests. Without this token, `approved: true` is
 * just a field any page could submit on a logged-in user's behalf, and the
 * response carries the authorization code. The token is issued only by the
 * `GET` half — which the API answers with the client's name for the user to
 * read — so a valid one cannot exist unless the screen was rendered.
 *
 * It is bound to the exact authorization request, not just the user: a token
 * obtained for one client cannot approve a grant for another.
 *
 * Stateless HMAC over the payload, reusing JWT_SECRET, matching
 * OAuthStateService. Not single-use — the paired Origin check is what stops
 * cross-site submission, and this binds the decision to a real screen.
 */
export class McpOAuthConsentService {
  private get secret(): string {
    return process.env[ENV.JWT_SECRET] ?? '';
  }

  issue(subject: McpConsentSubject): string {
    const payload = JSON.stringify({
      ...subject,
      nonce: randomBytes(16).toString('hex'),
      exp: Date.now() + MCP_OAUTH.CONSENT_TOKEN_TTL_MS,
    });
    const encoded = base64url(payload);
    return `${encoded}.${this.sign(encoded)}`;
  }

  /** True only for an unexpired token this server issued for exactly this request. */
  verify(token: string, subject: McpConsentSubject): boolean {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature || !equals(signature, this.sign(encoded))) return false;

    let payload: McpConsentSubject & { exp?: number };
    try {
      payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as McpConsentSubject & {
        exp?: number;
      };
    } catch {
      return false;
    }

    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return false;
    return (
      payload.userId === subject.userId &&
      payload.clientId === subject.clientId &&
      payload.redirectUri === subject.redirectUri &&
      payload.scope === subject.scope &&
      payload.codeChallenge === subject.codeChallenge
    );
  }

  private sign(encoded: string): string {
    return createHmac('sha256', this.secret).update(encoded).digest('base64url');
  }
}
