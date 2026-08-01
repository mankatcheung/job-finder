export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenService {
  sign(userId: string, email: string, sessionId: string, refreshTokenId: string): TokenPair;
  /**
   * `jti` is undefined for refresh tokens issued before rotation tracking was
   * added — callers must treat a missing `jti` as the legacy/bootstrap case.
   */
  verifyRefresh(token: string): { sub: string; email: string; sid: string; jti?: string };
  verifyAccess(token: string): { sub: string; email: string; sid?: string };
}
