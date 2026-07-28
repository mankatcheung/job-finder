import { eq, and } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { OAuthAccount, OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';
import type { IOAuthAccountRepository } from '#src/use-cases/ports/IOAuthAccountRepository.js';
import { oAuthAccount } from '../drizzle/schema.js';
import { getDb } from '../transactionContext.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleOAuthAccountRepository implements IOAuthAccountRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  private get database(): DrizzleDb {
    return getDb(this.db);
  }

  async findByProvider(
    provider: OAuthProviderName,
    providerAccountId: string,
  ): Promise<OAuthAccount | null> {
    const [row] = await this.database
      .select()
      .from(oAuthAccount)
      .where(
        and(
          eq(oAuthAccount.provider, provider),
          eq(oAuthAccount.providerAccountId, providerAccountId),
        ),
      );
    return row ? this.toEntity(row) : null;
  }

  async findAllByUserId(userId: string): Promise<OAuthAccount[]> {
    const rows = await this.database
      .select()
      .from(oAuthAccount)
      .where(eq(oAuthAccount.userId, userId));
    return rows.map(this.toEntity);
  }

  async create(data: {
    id: string;
    userId: string;
    provider: OAuthProviderName;
    providerAccountId: string;
    email: string | null;
  }): Promise<OAuthAccount> {
    const now = new Date();
    const row = {
      id: data.id,
      userId: data.userId,
      provider: data.provider,
      providerAccountId: data.providerAccountId,
      email: data.email ?? null,
      createdAt: now,
    };
    await this.database.insert(oAuthAccount).values(row);
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(oAuthAccount).where(eq(oAuthAccount.id, id));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(row: any): OAuthAccount {
    return {
      id: row.id,
      userId: row.userId,
      provider: row.provider,
      providerAccountId: row.providerAccountId,
      email: row.email ?? null,
      createdAt: row.createdAt,
    };
  }
}
