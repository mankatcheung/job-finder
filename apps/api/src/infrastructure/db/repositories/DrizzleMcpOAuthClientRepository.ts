import { eq } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { mcpOAuthClient } from '../schema.js';
import { getClient } from '../transactionContext.js';
import type { McpOAuthClient } from '#src/domain/mcpOAuth/McpOAuthClient.js';
import type {
  CreateMcpOAuthClientData,
  IMcpOAuthClientRepository,
} from '#src/use-cases/ports/IMcpOAuthClientRepository.js';

export class DrizzleMcpOAuthClientRepository implements IMcpOAuthClientRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async create(data: CreateMcpOAuthClientData): Promise<McpOAuthClient> {
    const [row] = await this.db
      .insert(mcpOAuthClient)
      .values({ ...data, redirectUris: JSON.stringify(data.redirectUris) })
      .returning();
    return this.toEntity(row);
  }

  async findById(id: string): Promise<McpOAuthClient | null> {
    const [row] = await this.db
      .select()
      .from(mcpOAuthClient)
      .where(eq(mcpOAuthClient.id, id))
      .limit(1);
    return row ? this.toEntity(row) : null;
  }

  private toEntity(row: typeof mcpOAuthClient.$inferSelect): McpOAuthClient {
    let redirectUris: string[];
    try {
      const parsed: unknown = JSON.parse(row.redirectUris);
      redirectUris =
        Array.isArray(parsed) && parsed.every((uri) => typeof uri === 'string') ? parsed : [];
    } catch {
      redirectUris = [];
    }

    return {
      id: row.id,
      name: row.name,
      redirectUris,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    };
  }
}
