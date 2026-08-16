import { eq, and, desc } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { apiToken, user } from '../schema.js';
import type { ApiToken, ApiTokenScope } from '#src/domain/apiToken/ApiToken.js';
import { getClient } from '../transactionContext.js';
import { DEFAULTS } from '#src/constants.js';
import type {
  IApiTokenRepository,
  CreateApiTokenData,
} from '#src/use-cases/ports/IApiTokenRepository.js';

export class DrizzleApiTokenRepository implements IApiTokenRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async findAllByUserId(userId: string): Promise<ApiToken[]> {
    const rows = await this.db
      .select()
      .from(apiToken)
      .where(eq(apiToken.userId, userId))
      .orderBy(desc(apiToken.createdAt));
    return rows.map((r) => this.toEntity(r));
  }

  async findByTokenHash(tokenHash: string): Promise<{ token: ApiToken; userEmail: string } | null> {
    const [row] = await this.db
      .select({ token: apiToken, userEmail: user.email })
      .from(apiToken)
      .innerJoin(user, eq(apiToken.userId, user.id))
      .where(eq(apiToken.tokenHash, tokenHash))
      .limit(1);
    if (!row) return null;
    return { token: this.toEntity(row.token), userEmail: row.userEmail };
  }

  async findById(id: string): Promise<ApiToken | null> {
    const [row] = await this.db.select().from(apiToken).where(eq(apiToken.id, id)).limit(1);
    return row ? this.toEntity(row) : null;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ApiToken | null> {
    const [row] = await this.db
      .select()
      .from(apiToken)
      .where(and(eq(apiToken.id, id), eq(apiToken.userId, userId)))
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateApiTokenData): Promise<ApiToken> {
    const [row] = await this.db
      .insert(apiToken)
      .values({
        id: data.id,
        userId: data.userId,
        name: data.name,
        tokenHash: data.tokenHash,
        scope: data.scope,
      })
      .returning();
    return this.toEntity(row);
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.db.update(apiToken).set({ lastUsedAt: new Date() }).where(eq(apiToken.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(apiToken).where(eq(apiToken.id, id));
  }

  private toEntity(row: typeof apiToken.$inferSelect): ApiToken {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      tokenHash: row.tokenHash,
      scope: (row.scope as ApiTokenScope) ?? DEFAULTS.API_TOKEN_SCOPE,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
    };
  }
}
