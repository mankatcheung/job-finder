import { eq } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { backupEmailVerificationToken } from '../schema.js';
import type { BackupEmailVerificationToken } from '#src/domain/backupEmailVerificationToken/BackupEmailVerificationToken.js';
import type { IBackupEmailVerificationTokenRepository } from '#src/use-cases/ports/IBackupEmailVerificationTokenRepository.js';
import { getClient } from '../transactionContext.js';

export class DrizzleBackupEmailVerificationTokenRepository implements IBackupEmailVerificationTokenRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async create(data: {
    id: string;
    userId: string;
    tokenHash: string;
    newBackupEmail: string;
    expiresAt: Date;
  }): Promise<BackupEmailVerificationToken> {
    const [row] = await this.db.insert(backupEmailVerificationToken).values(data).returning();
    return this.toEntity(row);
  }

  async findByTokenHash(tokenHash: string): Promise<BackupEmailVerificationToken | null> {
    const [row] = await this.db
      .select()
      .from(backupEmailVerificationToken)
      .where(eq(backupEmailVerificationToken.tokenHash, tokenHash))
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.db
      .update(backupEmailVerificationToken)
      .set({ usedAt: new Date() })
      .where(eq(backupEmailVerificationToken.id, id));
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.db
      .delete(backupEmailVerificationToken)
      .where(eq(backupEmailVerificationToken.userId, userId));
  }

  private toEntity(
    row: typeof backupEmailVerificationToken.$inferSelect,
  ): BackupEmailVerificationToken {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      newBackupEmail: row.newBackupEmail,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    };
  }
}
