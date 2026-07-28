import { eq, desc } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { ApiToken, ApiTokenScope } from '#src/domain/apiToken/ApiToken.js';
import type {
  IApiTokenRepository,
  CreateApiTokenData,
} from '#src/use-cases/ports/IApiTokenRepository.js';
import { apiToken, user } from '../drizzle/schema.js';
import { getDb } from '../transactionContext.js';
import { DEFAULTS } from '#src/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleApiTokenRepository implements IApiTokenRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  private get database(): DrizzleDb {
    return getDb(this.db);
  }

  async findAllByUserId(userId: string): Promise<ApiToken[]> {
    const rows = await this.database
      .select()
      .from(apiToken)
      .where(eq(apiToken.userId, userId))
      .orderBy(desc(apiToken.createdAt));
    return rows.map(this.toEntity);
  }

  async findByTokenHash(tokenHash: string): Promise<{ token: ApiToken; userEmail: string } | null> {
    const [row] = await this.database
      .select({
        id: apiToken.id,
        userId: apiToken.userId,
        name: apiToken.name,
        tokenHash: apiToken.tokenHash,
        scope: apiToken.scope,
        lastUsedAt: apiToken.lastUsedAt,
        createdAt: apiToken.createdAt,
        userEmail: user.email,
      })
      .from(apiToken)
      .innerJoin(user, eq(apiToken.userId, user.id))
      .where(eq(apiToken.tokenHash, tokenHash));
    if (!row) return null;
    return {
      token: this.toEntity(row),
      userEmail: row.userEmail,
    };
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ApiToken | null> {
    const { and } = await import('drizzle-orm');
    const [row] = await this.database
      .select()
      .from(apiToken)
      .where(and(eq(apiToken.id, id), eq(apiToken.userId, userId)));
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateApiTokenData): Promise<ApiToken> {
    const now = new Date();
    const row = {
      id: data.id,
      userId: data.userId,
      name: data.name,
      tokenHash: data.tokenHash,
      scope: data.scope,
      createdAt: now,
    };
    await this.database.insert(apiToken).values(row);
    return this.toEntity(row);
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.database.update(apiToken).set({ lastUsedAt: new Date() }).where(eq(apiToken.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(apiToken).where(eq(apiToken.id, id));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(row: any): ApiToken {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      tokenHash: row.tokenHash,
      scope: (row.scope as ApiTokenScope) ?? DEFAULTS.API_TOKEN_SCOPE,
      lastUsedAt: row.lastUsedAt ?? null,
      createdAt: row.createdAt,
    };
  }
}
