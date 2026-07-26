import type { EmailVerificationToken } from '#src/domain/emailVerificationToken/EmailVerificationToken.js';

export interface IEmailVerificationTokenRepository {
  create(data: {
    id: string;
    userId: string;
    tokenHash: string;
    newEmail?: string;
    expiresAt: Date;
  }): Promise<EmailVerificationToken>;
  findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null>;
  markUsed(id: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
