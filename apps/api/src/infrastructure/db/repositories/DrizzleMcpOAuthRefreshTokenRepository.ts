import { and, eq, isNull } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { mcpOAuthRefreshToken } from '../schema.js';
import { getClient } from '../transactionContext.js';
import type { McpOAuthRefreshToken } from '#src/domain/mcpOAuth/McpOAuthRefreshToken.js';
import type {
  CreateMcpOAuthRefreshTokenData,
  IMcpOAuthRefreshTokenRepository,
} from '#src/use-cases/ports/IMcpOAuthRefreshTokenRepository.js';

export class DrizzleMcpOAuthRefreshTokenRepository implements IMcpOAuthRefreshTokenRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async create(data: CreateMcpOAuthRefreshTokenData): Promise<McpOAuthRefreshToken> {
    const [row] = await this.db.insert(mcpOAuthRefreshToken).values(data).returning();
    return this.toEntity(row);
  }

  async findByTokenHash(tokenHash: string): Promise<McpOAuthRefreshToken | null> {
    const [row] = await this.db
      .select()
      .from(mcpOAuthRefreshToken)
      .where(eq(mcpOAuthRefreshToken.tokenHash, tokenHash))
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  async markUsed(id: string, usedAt: Date): Promise<boolean> {
    const rows = await this.db
      .update(mcpOAuthRefreshToken)
      .set({ usedAt })
      .where(and(eq(mcpOAuthRefreshToken.id, id), isNull(mcpOAuthRefreshToken.usedAt)))
      .returning({ id: mcpOAuthRefreshToken.id });
    return rows.length > 0;
  }

  async revokeFamily(familyId: string, revokedAt: Date): Promise<void> {
    await this.db
      .update(mcpOAuthRefreshToken)
      .set({ revokedAt })
      .where(
        and(eq(mcpOAuthRefreshToken.familyId, familyId), isNull(mcpOAuthRefreshToken.revokedAt)),
      );
  }

  private toEntity(row: typeof mcpOAuthRefreshToken.$inferSelect): McpOAuthRefreshToken {
    return {
      id: row.id,
      tokenHash: row.tokenHash,
      familyId: row.familyId,
      clientId: row.clientId,
      userId: row.userId,
      scope: row.scope as McpOAuthRefreshToken['scope'],
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    };
  }
}
