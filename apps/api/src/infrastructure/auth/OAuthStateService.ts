import { createHmac, randomBytes } from 'crypto';
import type { OAuthProviderName } from '@/domain/oauthAccount/OAuthAccount.js';
import { ENV, OAUTH } from '@/constants.js';

export interface OAuthState {
  provider: OAuthProviderName;
  mode: 'login' | 'link';
  userId?: string;
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

  issue(provider: OAuthProviderName, mode: 'login' | 'link', userId?: string): string {
    const payload: OAuthState = {
      provider,
      mode,
      userId,
      nonce: randomBytes(16).toString('hex'),
      exp: Date.now() + OAUTH.STATE_TTL_MS,
    };
    const encodedPayload = base64url(JSON.stringify(payload));
    const signature = createHmac('sha256', this.secret).update(encodedPayload).digest('base64url');
    return `${encodedPayload}.${signature}`;
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
