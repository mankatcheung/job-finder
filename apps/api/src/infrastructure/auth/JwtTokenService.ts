import jwt from 'jsonwebtoken';
import type { ITokenService, TokenPair } from '#src/use-cases/ports/ITokenService.js';
import { ENV, ERROR_CODES, JWT_EXPIRY } from '#src/constants.js';

export class JwtTokenService implements ITokenService {
  sign(
    userId: string,
    email: string,
    sessionId: string,
    refreshTokenId: string,
    authTimeMs: number,
  ): TokenPair {
    const accessToken = jwt.sign(
      { sub: userId, email, sid: sessionId, authTime: authTimeMs },
      process.env[ENV.JWT_SECRET]!,
      { expiresIn: JWT_EXPIRY.ACCESS },
    );
    const refreshToken = jwt.sign(
      { sub: userId, email, sid: sessionId, jti: refreshTokenId, authTime: authTimeMs },
      process.env[ENV.JWT_REFRESH_SECRET]!,
      { expiresIn: JWT_EXPIRY.REFRESH },
    );
    return { accessToken, refreshToken };
  }

  verifyRefresh(token: string): {
    sub: string;
    email: string;
    sid: string;
    jti?: string;
    authTime?: number;
  } {
    try {
      return jwt.verify(token, process.env[ENV.JWT_REFRESH_SECRET]!) as {
        sub: string;
        email: string;
        sid: string;
        jti?: string;
        authTime?: number;
      };
    } catch {
      throw Object.assign(new Error('Invalid refresh token'), { code: ERROR_CODES.UNAUTHORIZED });
    }
  }

  verifyAccess(token: string): { sub: string; email: string; sid?: string; authTime?: number } {
    return jwt.verify(token, process.env[ENV.JWT_SECRET]!) as {
      sub: string;
      email: string;
      sid?: string;
      authTime?: number;
    };
  }
}
