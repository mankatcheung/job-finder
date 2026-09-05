import { createHmac, timingSafeEqual } from 'crypto';
import { ENV, OAUTH } from '#src/infrastructure/config/constants.js';
import { deriveCodeChallenge, isWellFormedPkceValue } from '#src/infrastructure/auth/pkce.js';

export interface MobileOAuthHandoff {
  accessToken: string;
  refreshToken: string;
  exp: number;
  codeChallenge: string;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function matchesPkce(verifier: string, expectedChallenge: string): boolean {
  const actual = Buffer.from(deriveCodeChallenge(verifier));
  const expected = Buffer.from(expectedChallenge);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
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
 *
 * PKCE-bound on top of that: the custom-scheme redirect this code travels
 * through is OS-mediated, not API-mediated, so another app registering the
 * same `trakwyn://` scheme could in principle intercept it (the RFC 8252
 * native-app threat PKCE exists for). Binding the code to a `code_challenge`
 * the app chose *before* opening the browser means an interceptor holding
 * only the code — not the verifier the legitimate app kept in memory — still
 * cannot redeem it.
 */
export class MobileOAuthHandoffService {
  private get secret(): string {
    return process.env[ENV.JWT_SECRET] ?? '';
  }

  issue(accessToken: string, refreshToken: string, codeChallenge: string): string {
    const payload: MobileOAuthHandoff = {
      accessToken,
      refreshToken,
      exp: Date.now() + OAUTH.MOBILE_HANDOFF_TTL_MS,
      codeChallenge,
    };
    const encodedPayload = base64url(JSON.stringify(payload));
    const signature = createHmac('sha256', this.secret).update(encodedPayload).digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  verify(code: string, codeVerifier: string): { accessToken: string; refreshToken: string } {
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
    if (!isWellFormedPkceValue(codeVerifier) || !matchesPkce(codeVerifier, payload.codeChallenge)) {
      throw new Error('Invalid OAuth handoff PKCE verifier');
    }
    return { accessToken: payload.accessToken, refreshToken: payload.refreshToken };
  }
}
