export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenService {
  /** `authTimeMs` is the epoch-ms of the session's last full authentication — see `REAUTH` in constants.ts. */
  sign(
    userId: string,
    email: string,
    sessionId: string,
    refreshTokenId: string,
    authTimeMs: number,
  ): TokenPair;
  /**
   * `jti` is undefined for refresh tokens issued before rotation tracking was
   * added — callers must treat a missing `jti` as the legacy/bootstrap case.
   * `authTime` is undefined for tokens issued before step-up auth (JEF-44)
   * was added — callers must treat a missing `authTime` as maximally stale.
   */
  verifyRefresh(token: string): {
    sub: string;
    email: string;
    sid: string;
    jti?: string;
    authTime?: number;
  };
  verifyAccess(token: string): { sub: string; email: string; sid?: string; authTime?: number };
}
