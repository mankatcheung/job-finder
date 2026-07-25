import type { IOAuthProvider, OAuthProfile } from '@/use-cases/ports/IOAuthProvider.js';
import { ENV, OAUTH } from '@/constants.js';

interface GoogleTokenResponse {
  access_token: string;
}

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

export class GoogleOAuthProvider implements IOAuthProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.clientId = process.env[ENV.GOOGLE_OAUTH_CLIENT_ID] ?? '';
    this.clientSecret = process.env[ENV.GOOGLE_OAUTH_CLIENT_SECRET] ?? '';
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });
    return `${OAUTH.GOOGLE_AUTHORIZATION_URL}?${params.toString()}`;
  }

  async exchangeCodeForProfile(code: string, redirectUri: string): Promise<OAuthProfile> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(`${ENV.GOOGLE_OAUTH_CLIENT_ID}/${ENV.GOOGLE_OAUTH_CLIENT_SECRET} not set`);
    }

    const tokenResponse = await fetch(OAUTH.GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenResponse.ok) {
      throw new Error(`Google token exchange failed: ${tokenResponse.status}`);
    }
    const { access_token: accessToken } = (await tokenResponse.json()) as GoogleTokenResponse;

    const userInfoResponse = await fetch(OAUTH.GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userInfoResponse.ok) {
      throw new Error(`Google userinfo fetch failed: ${userInfoResponse.status}`);
    }
    const profile = (await userInfoResponse.json()) as GoogleUserInfo;

    return {
      providerAccountId: profile.sub,
      email: profile.email ?? null,
      emailVerified: profile.email_verified ?? false,
      name: profile.name ?? null,
    };
  }
}
