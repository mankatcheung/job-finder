import { createHmac } from 'crypto';
import { ENV, OAUTH } from '#src/infrastructure/config/constants.js';

export interface MobileOAuthHandoff {
  accessToken: string;
  refreshToken: string;
  exp: number;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

/**
 * Carries a finished mobile OAuth login's tokens across the one hop the API
 * cannot control: the custom-scheme redirect from the system browser back
 * into the app (JEF-275). The callback mints one of these instead of setting
 * cookies (React Native has no cookie jar tied to the API, same as
 * mobileAuthMutations.ts); the app's `exchangeMobileOAuthCode` mutation
 * redeems it for the real tokens.
 *
 * Stateless (HMAC over the payload, reusing JWT_SECRET) rather than a cache
 * entry, matching OAuthStateService — and deliberately short-lived
 * (OAUTH.MOBILE_HANDOFF_TTL_MS) since redemption happens moments after issue.
 * Not single-use: a code that leaks is exactly as dangerous as the tokens it
 * carries, but only for the ~60 seconds it's valid, which is the same
 * exposure window a raw token-bearing redirect URL would have — this adds no
 * capability beyond that, just a shorter one.
 */
export class MobileOAuthHandoffService {
  private get secret(): string {
    return process.env[ENV.JWT_SECRET] ?? '';
  }

  issue(accessToken: string, refreshToken: string): string {
    const payload: MobileOAuthHandoff = {
      accessToken,
      refreshToken,
      exp: Date.now() + OAUTH.MOBILE_HANDOFF_TTL_MS,
    };
    const encodedPayload = base64url(JSON.stringify(payload));
    const signature = createHmac('sha256', this.secret).update(encodedPayload).digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  verify(code: string): { accessToken: string; refreshToken: string } {
    const [encodedPayload, signature] = code.split('.');
    if (!encodedPayload || !signature) {
      throw new Error('Malformed OAuth handoff code');
    }
    const expectedSignature = createHmac('sha256', this.secret)
      .update(encodedPayload)
      .digest('base64url');
    if (signature !== expectedSignature) {
      throw new Error('Invalid OAuth handoff code signature');
    }
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString(),
    ) as MobileOAuthHandoff;
    if (payload.exp < Date.now()) {
      throw new Error('OAuth handoff code expired');
    }
    return { accessToken: payload.accessToken, refreshToken: payload.refreshToken };
  }
}
