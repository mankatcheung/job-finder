export interface BackupEmailVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  newBackupEmail: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}
