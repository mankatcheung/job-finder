import { eq, and } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { oauthAccount } from '../schema.js';
import type { OAuthAccount, OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';
import type { IOAuthAccountRepository } from '#src/use-cases/ports/IOAuthAccountRepository.js';
import { getClient } from '../transactionContext.js';

export class DrizzleOAuthAccountRepository implements IOAuthAccountRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async findByProvider(
    provider: OAuthProviderName,
    providerAccountId: string,
  ): Promise<OAuthAccount | null> {
    const [row] = await this.db
      .select()
      .from(oauthAccount)
      .where(
        and(
          eq(oauthAccount.provider, provider),
          eq(oauthAccount.providerAccountId, providerAccountId),
        ),
      )
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  async findAllByUserId(userId: string): Promise<OAuthAccount[]> {
    const rows = await this.db.select().from(oauthAccount).where(eq(oauthAccount.userId, userId));
    return rows.map((r) => this.toEntity(r));
  }

  async create(data: {
    id: string;
    userId: string;
    provider: OAuthProviderName;
    providerAccountId: string;
    email: string | null;
  }): Promise<OAuthAccount> {
    const [row] = await this.db.insert(oauthAccount).values(data).returning();
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(oauthAccount).where(eq(oauthAccount.id, id));
  }

  private toEntity(row: typeof oauthAccount.$inferSelect): OAuthAccount {
    return {
      id: row.id,
      userId: row.userId,
      provider: row.provider as OAuthProviderName,
      providerAccountId: row.providerAccountId,
      email: row.email,
      createdAt: row.createdAt,
    };
  }
}
