import { eq } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { passwordResetToken } from '../schema.js';
import type { PasswordResetToken } from '#src/domain/passwordResetToken/PasswordResetToken.js';
import type { IPasswordResetTokenRepository } from '#src/use-cases/ports/IPasswordResetTokenRepository.js';
import { getClient } from '../transactionContext.js';

export class DrizzlePasswordResetTokenRepository implements IPasswordResetTokenRepository {
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
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    const [row] = await this.db.insert(passwordResetToken).values(data).returning();
    return this.toEntity(row);
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const [row] = await this.db
      .select()
      .from(passwordResetToken)
      .where(eq(passwordResetToken.tokenHash, tokenHash))
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.db
      .update(passwordResetToken)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetToken.id, id));
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.db.delete(passwordResetToken).where(eq(passwordResetToken.userId, userId));
  }

  private toEntity(row: typeof passwordResetToken.$inferSelect): PasswordResetToken {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    };
  }
}
