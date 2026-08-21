export interface OAuthProfile {
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
}

export interface IOAuthProvider {
  /**
   * Builds the URL the browser is redirected to, to start the provider's
   * consent flow. `codeChallenge` is the SHA-256 of a verifier this server
   * keeps — required rather than optional, so PKCE cannot be dropped by a
   * caller simply not passing it (JEF-200).
   */
  getAuthorizationUrl(state: string, redirectUri: string, codeChallenge: string): string;
  /** Exchanges the callback's authorization code for the user's profile. */
  exchangeCodeForProfile(
    code: string,
    redirectUri: string,
    codeVerifier: string,
  ): Promise<OAuthProfile>;
}
