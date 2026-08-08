import type { BackupEmailVerificationToken } from '#src/domain/backupEmailVerificationToken/BackupEmailVerificationToken.js';

export interface IBackupEmailVerificationTokenRepository {
  create(data: {
    id: string;
    userId: string;
    tokenHash: string;
    newBackupEmail: string;
    expiresAt: Date;
  }): Promise<BackupEmailVerificationToken>;
  findByTokenHash(tokenHash: string): Promise<BackupEmailVerificationToken | null>;
  markUsed(id: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
