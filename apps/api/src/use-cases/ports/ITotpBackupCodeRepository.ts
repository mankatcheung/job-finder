import type { TotpBackupCode } from '#src/domain/totpBackupCode/TotpBackupCode.js';

export interface ITotpBackupCodeRepository {
  create(data: { id: string; userId: string; codeHash: string }): Promise<TotpBackupCode>;
  findByCodeHash(codeHash: string): Promise<TotpBackupCode | null>;
  markUsed(id: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
