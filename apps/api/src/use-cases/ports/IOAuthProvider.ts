export interface OAuthProfile {
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
}

export interface IOAuthProvider {
  /** Builds the URL the browser is redirected to, to start the provider's consent flow. */
  getAuthorizationUrl(state: string, redirectUri: string): string;
  /** Exchanges the callback's authorization code for the user's profile. */
  exchangeCodeForProfile(code: string, redirectUri: string): Promise<OAuthProfile>;
}
