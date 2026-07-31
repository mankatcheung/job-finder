import type { Session } from '#src/domain/session/Session.js';

export interface CreateSessionData {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  currentRefreshTokenId: string;
}

export interface RotateRefreshTokenData {
  currentRefreshTokenId: string;
  previousRefreshTokenId: string;
  previousRotatedAt: Date;
  expiresAt: Date;
}

export interface ISessionRepository {
  create(data: CreateSessionData): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findByIdAndUserId(id: string, userId: string): Promise<Session | null>;
  findActiveByUserId(userId: string): Promise<Session[]>;
  touch(id: string, expiresAt: Date): Promise<void>;
  rotateRefreshToken(id: string, data: RotateRefreshTokenData): Promise<void>;
  revoke(id: string): Promise<void>;
  revokeAllForUserExcept(userId: string, exceptId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
