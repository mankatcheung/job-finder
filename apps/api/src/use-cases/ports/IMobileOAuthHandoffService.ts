export interface MobileOAuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Port over MobileOAuthHandoffService — the use case only ever redeems a
 * code, never mints one (that happens in http/routes/oauth.routes.ts, which
 * is allowed to reach infrastructure directly).
 *
 * `codeVerifier` is PKCE binding this redemption to whichever app instance
 * started the flow (JEF-275) — see MobileOAuthHandoffService for why the
 * handoff code alone isn't enough.
 */
export interface IMobileOAuthHandoffService {
  verify(code: string, codeVerifier: string): MobileOAuthTokens;
}
