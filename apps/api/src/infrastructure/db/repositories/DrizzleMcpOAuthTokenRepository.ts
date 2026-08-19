import { eq } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { mcpOAuthAccessToken } from '../schema.js';
import { getClient } from '../transactionContext.js';
import type {
  CreateMcpOAuthAccessTokenData,
  IMcpOAuthTokenRepository,
} from '#src/use-cases/ports/IMcpOAuthTokenRepository.js';
import type {
  McpOAuthAccessToken,
  McpOAuthScope,
} from '#src/domain/mcpOAuth/McpOAuthAccessToken.js';

export class DrizzleMcpOAuthTokenRepository implements IMcpOAuthTokenRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async create(data: CreateMcpOAuthAccessTokenData): Promise<McpOAuthAccessToken> {
    const [row] = await this.db.insert(mcpOAuthAccessToken).values(data).returning();
    return this.toEntity(row);
  }

  async findByTokenHash(tokenHash: string): Promise<McpOAuthAccessToken | null> {
    const [row] = await this.db
      .select()
      .from(mcpOAuthAccessToken)
      .where(eq(mcpOAuthAccessToken.tokenHash, tokenHash))
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.db
      .update(mcpOAuthAccessToken)
      .set({ lastUsedAt: new Date() })
      .where(eq(mcpOAuthAccessToken.id, id));
  }

  async revoke(id: string): Promise<void> {
    await this.db
      .update(mcpOAuthAccessToken)
      .set({ revokedAt: new Date() })
      .where(eq(mcpOAuthAccessToken.id, id));
  }

  private toEntity(row: typeof mcpOAuthAccessToken.$inferSelect): McpOAuthAccessToken {
    return {
      id: row.id,
      userId: row.userId,
      clientId: row.clientId,
      tokenHash: row.tokenHash,
      scope: row.scope as McpOAuthScope,
      audience: row.audience,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
    };
  }
}
