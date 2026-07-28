import { eq } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { TotpBackupCode } from '#src/domain/totpBackupCode/TotpBackupCode.js';
import type { ITotpBackupCodeRepository } from '#src/use-cases/ports/ITotpBackupCodeRepository.js';
import { totpBackupCode } from '../drizzle/schema.js';
import { getDb } from '../transactionContext.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleTotpBackupCodeRepository implements ITotpBackupCodeRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  private get database(): DrizzleDb {
    return getDb(this.db);
  }

  async create(data: { id: string; userId: string; codeHash: string }): Promise<TotpBackupCode> {
    const row = {
      id: data.id,
      userId: data.userId,
      codeHash: data.codeHash,
      createdAt: new Date(),
    };
    await this.database.insert(totpBackupCode).values(row);
    return this.toEntity(row);
  }

  async findByCodeHash(codeHash: string): Promise<TotpBackupCode | null> {
    const [row] = await this.database
      .select()
      .from(totpBackupCode)
      .where(eq(totpBackupCode.codeHash, codeHash));
    return row ? this.toEntity(row) : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.database
      .update(totpBackupCode)
      .set({ usedAt: new Date() })
      .where(eq(totpBackupCode.id, id));
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.database.delete(totpBackupCode).where(eq(totpBackupCode.userId, userId));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(row: any): TotpBackupCode {
    return {
      id: row.id,
      userId: row.userId,
      codeHash: row.codeHash,
      usedAt: row.usedAt ?? null,
      createdAt: row.createdAt,
    };
  }
}
