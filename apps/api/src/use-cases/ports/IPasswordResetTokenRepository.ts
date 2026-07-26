import type { PasswordResetToken } from '#src/domain/passwordResetToken/PasswordResetToken.js';

export interface IPasswordResetTokenRepository {
  create(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken>;
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  markUsed(id: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
