export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenService {
  sign(userId: string, email: string, sessionId: string): TokenPair;
  verifyRefresh(token: string): { sub: string; email: string; sid: string };
}
