import type { IOAuthProvider, OAuthProfile } from '#src/use-cases/ports/IOAuthProvider.js';
import type { OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';
import { ROUTES } from '#src/constants.js';

/**
 * A same-origin stand-in for Google/GitHub, selected by
 * `OAUTH_PROVIDER_MODE=fake` (mirrors `EMAIL_PROVIDER=console` and
 * `STORAGE_PROVIDER=local`). `getAuthorizationUrl` points at this server's own
 * fake consent route (`http/routes/fakeOAuthConsent.routes.ts`, registered
 * only in that same mode) instead of a real provider, so e2e tests can drive
 * the whole browser round trip — real redirect, real PKCE/state cookie, real
 * callback handler — without a live Google/GitHub dependency or secrets in
 * CI.
 *
 * `exchangeCodeForProfile` decodes the profile the consent route encoded into
 * the code itself, so no state needs to be shared between the two requests,
 * and makes no network call at all — the one thing that would be genuinely
 * unreachable from a CI runner anyway.
 */
abstract class FakeOAuthProvider implements IOAuthProvider {
  protected abstract readonly provider: OAuthProviderName;

  // redirectUri/codeChallenge are part of IOAuthProvider's contract (every
  // real caller — oauth.routes.ts — passes all three) but unused here: the
  // fake consent route derives its own redirect_uri, and there is no real
  // token exchange for a challenge to protect.
  getAuthorizationUrl(state: string, _redirectUri: string, _codeChallenge: string): string {
    const params = new URLSearchParams({ provider: this.provider, state });
    return `${ROUTES.OAUTH_FAKE_CONSENT}?${params.toString()}`;
  }

  async exchangeCodeForProfile(
    code: string,
    _redirectUri: string,
    _codeVerifier: string,
  ): Promise<OAuthProfile> {
    return JSON.parse(Buffer.from(code, 'base64url').toString('utf8')) as OAuthProfile;
  }
}

export class FakeGoogleOAuthProvider extends FakeOAuthProvider {
  protected readonly provider: OAuthProviderName = 'google';
}

export class FakeGitHubOAuthProvider extends FakeOAuthProvider {
  protected readonly provider: OAuthProviderName = 'github';
}
