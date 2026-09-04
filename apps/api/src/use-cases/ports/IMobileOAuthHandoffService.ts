export interface MobileOAuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Port over MobileOAuthHandoffService — the use case only ever redeems a
 * code, never mints one (that happens in http/routes/oauth.routes.ts, which
 * is allowed to reach infrastructure directly).
 */
export interface IMobileOAuthHandoffService {
  verify(code: string): MobileOAuthTokens;
}
