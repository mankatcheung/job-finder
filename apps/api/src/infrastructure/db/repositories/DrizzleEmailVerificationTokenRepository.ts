import { eq } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { emailVerificationToken } from '../schema.js';
import type { EmailVerificationToken } from '#src/domain/emailVerificationToken/EmailVerificationToken.js';
import type { IEmailVerificationTokenRepository } from '#src/use-cases/ports/IEmailVerificationTokenRepository.js';
import { getClient } from '../transactionContext.js';

export class DrizzleEmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
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
    newEmail?: string;
    expiresAt: Date;
  }): Promise<EmailVerificationToken> {
    const [row] = await this.db.insert(emailVerificationToken).values(data).returning();
    return this.toEntity(row);
  }

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    const [row] = await this.db
      .select()
      .from(emailVerificationToken)
      .where(eq(emailVerificationToken.tokenHash, tokenHash))
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.db
      .update(emailVerificationToken)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationToken.id, id));
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.db.delete(emailVerificationToken).where(eq(emailVerificationToken.userId, userId));
  }

  private toEntity(row: typeof emailVerificationToken.$inferSelect): EmailVerificationToken {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      newEmail: row.newEmail,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    };
  }
}
