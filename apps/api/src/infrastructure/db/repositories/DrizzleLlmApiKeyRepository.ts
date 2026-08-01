import { eq, and } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { llmApiKey } from '../schema.js';
import type { LlmApiKey } from '#src/domain/llmApiKey/LlmApiKey.js';
import type {
  ILlmApiKeyRepository,
  UpsertLlmApiKeyData,
} from '#src/use-cases/ports/ILlmApiKeyRepository.js';
import { getClient } from '../transactionContext.js';

export class DrizzleLlmApiKeyRepository implements ILlmApiKeyRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async upsert(data: UpsertLlmApiKeyData): Promise<LlmApiKey> {
    const existing = await this.findByUserIdAndProvider(data.userId, data.provider);

    if (existing) {
      const [row] = await this.db
        .update(llmApiKey)
        .set({
          apiKey: data.apiKey,
          model: data.model,
          baseUrl: data.baseUrl,
          updatedAt: new Date(),
        })
        .where(eq(llmApiKey.id, existing.id))
        .returning();
      return this.toEntity(row);
    }

    const [row] = await this.db.insert(llmApiKey).values(data).returning();
    return this.toEntity(row);
  }

  async findByUserIdAndProvider(userId: string, provider: string): Promise<LlmApiKey | null> {
    const [row] = await this.db
      .select()
      .from(llmApiKey)
      .where(and(eq(llmApiKey.userId, userId), eq(llmApiKey.provider, provider)));
    return row ? this.toEntity(row) : null;
  }

  async findAllByUserId(userId: string): Promise<LlmApiKey[]> {
    const rows = await this.db.select().from(llmApiKey).where(eq(llmApiKey.userId, userId));
    return rows.map((r) => this.toEntity(r));
  }

  async delete(userId: string, provider: string): Promise<void> {
    await this.db
      .delete(llmApiKey)
      .where(and(eq(llmApiKey.userId, userId), eq(llmApiKey.provider, provider)));
  }

  private toEntity(row: typeof llmApiKey.$inferSelect): LlmApiKey {
    return {
      id: row.id,
      userId: row.userId,
      provider: row.provider,
      apiKey: row.apiKey,
      model: row.model,
      baseUrl: row.baseUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
