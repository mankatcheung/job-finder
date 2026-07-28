import { eq } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { EmailVerificationToken } from '#src/domain/emailVerificationToken/EmailVerificationToken.js';
import type { IEmailVerificationTokenRepository } from '#src/use-cases/ports/IEmailVerificationTokenRepository.js';
import { emailVerificationToken } from '../drizzle/schema.js';
import { getDb } from '../transactionContext.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleEmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  private get database(): DrizzleDb {
    return getDb(this.db);
  }

  async create(data: {
    id: string;
    userId: string;
    tokenHash: string;
    newEmail?: string;
    expiresAt: Date;
  }): Promise<EmailVerificationToken> {
    const now = new Date();
    const row = {
      id: data.id,
      userId: data.userId,
      tokenHash: data.tokenHash,
      newEmail: data.newEmail ?? null,
      expiresAt: data.expiresAt,
      createdAt: now,
    };
    await this.database.insert(emailVerificationToken).values(row);
    return this.toEntity(row);
  }

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    const [row] = await this.database
      .select()
      .from(emailVerificationToken)
      .where(eq(emailVerificationToken.tokenHash, tokenHash));
    return row ? this.toEntity(row) : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.database
      .update(emailVerificationToken)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationToken.id, id));
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.database
      .delete(emailVerificationToken)
      .where(eq(emailVerificationToken.userId, userId));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(row: any): EmailVerificationToken {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      newEmail: row.newEmail ?? null,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt ?? null,
      createdAt: row.createdAt,
    };
  }
}
