import { and, eq, isNull } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { mcpOAuthAuthorizationCode } from '../schema.js';
import { getClient } from '../transactionContext.js';
import type { McpOAuthAuthorizationCode } from '#src/domain/mcpOAuth/McpOAuthAuthorizationCode.js';
import type {
  CreateMcpOAuthAuthorizationCodeData,
  IMcpOAuthAuthorizationCodeRepository,
} from '#src/use-cases/ports/IMcpOAuthAuthorizationCodeRepository.js';

export class DrizzleMcpOAuthAuthorizationCodeRepository implements IMcpOAuthAuthorizationCodeRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async create(data: CreateMcpOAuthAuthorizationCodeData): Promise<McpOAuthAuthorizationCode> {
    const [row] = await this.db.insert(mcpOAuthAuthorizationCode).values(data).returning();
    return this.toEntity(row);
  }

  async findByCodeHash(codeHash: string): Promise<McpOAuthAuthorizationCode | null> {
    const [row] = await this.db
      .select()
      .from(mcpOAuthAuthorizationCode)
      .where(eq(mcpOAuthAuthorizationCode.codeHash, codeHash))
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  async consume(id: string, consumedAt: Date): Promise<boolean> {
    const rows = await this.db
      .update(mcpOAuthAuthorizationCode)
      .set({ consumedAt })
      .where(
        and(eq(mcpOAuthAuthorizationCode.id, id), isNull(mcpOAuthAuthorizationCode.consumedAt)),
      )
      .returning({ id: mcpOAuthAuthorizationCode.id });
    return rows.length > 0;
  }

  private toEntity(row: typeof mcpOAuthAuthorizationCode.$inferSelect): McpOAuthAuthorizationCode {
    return {
      id: row.id,
      codeHash: row.codeHash,
      familyId: row.familyId,
      clientId: row.clientId,
      userId: row.userId,
      redirectUri: row.redirectUri,
      scope: row.scope as McpOAuthAuthorizationCode['scope'],
      codeChallenge: row.codeChallenge,
      codeChallengeMethod: row.codeChallengeMethod as 'S256',
      expiresAt: row.expiresAt,
      consumedAt: row.consumedAt,
      createdAt: row.createdAt,
    };
  }
}
