import { createHmac, randomBytes } from 'crypto';
import type { OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';
import { ENV, OAUTH } from '#src/constants.js';

export interface OAuthState {
  provider: OAuthProviderName;
  mode: 'login' | 'link';
  userId?: string;
  returnTo?: string;
  nonce: string;
  exp: number;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

/**
 * Signs/verifies the short-lived `state` param carried through the OAuth
 * redirect dance. Stateless (HMAC over the payload) so it needs no server-side
 * storage and works across restarts/instances — reuses JWT_SECRET rather than
 * introducing a new secret.
 */
export class OAuthStateService {
  private get secret(): string {
    return process.env[ENV.JWT_SECRET] ?? '';
  }

  /**
   * Returns the signed state and the nonce inside it. The caller needs the
   * nonce separately so it can be stored in a cookie: the signature proves we
   * minted this state, and the cookie is what proves we minted it for *this*
   * browser (JEF-198).
   */
  issue(
    provider: OAuthProviderName,
    mode: 'login' | 'link',
    userId?: string,
    returnTo?: string,
  ): { state: string; nonce: string } {
    const nonce = randomBytes(16).toString('hex');
    const payload: OAuthState = {
      provider,
      mode,
      userId,
      returnTo,
      nonce,
      exp: Date.now() + OAUTH.STATE_TTL_MS,
    };
    const encodedPayload = base64url(JSON.stringify(payload));
    const signature = createHmac('sha256', this.secret).update(encodedPayload).digest('base64url');
    return { state: `${encodedPayload}.${signature}`, nonce };
  }

  verify(state: string): OAuthState {
    const [encodedPayload, signature] = state.split('.');
    if (!encodedPayload || !signature) {
      throw new Error('Malformed OAuth state');
    }
    const expectedSignature = createHmac('sha256', this.secret)
      .update(encodedPayload)
      .digest('base64url');
    if (signature !== expectedSignature) {
      throw new Error('Invalid OAuth state signature');
    }
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as OAuthState;
    if (payload.exp < Date.now()) {
      throw new Error('OAuth state expired');
    }
    return payload;
  }
}
