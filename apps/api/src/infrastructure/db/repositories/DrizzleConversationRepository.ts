import { eq, desc } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { conversation } from '../schema.js';
import type { Conversation } from '#src/domain/conversation/Conversation.js';
import type {
  IConversationRepository,
  CreateConversationData,
} from '#src/use-cases/ports/IConversationRepository.js';
import { getClient } from '../transactionContext.js';

export class DrizzleConversationRepository implements IConversationRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async create(data: CreateConversationData): Promise<Conversation> {
    const [row] = await this.db.insert(conversation).values(data).returning();
    return this.toEntity(row);
  }

  async findById(id: string): Promise<Conversation | null> {
    const [row] = await this.db.select().from(conversation).where(eq(conversation.id, id));
    return row ? this.toEntity(row) : null;
  }

  async findAllByUserId(userId: string): Promise<Conversation[]> {
    const rows = await this.db
      .select()
      .from(conversation)
      .where(eq(conversation.userId, userId))
      .orderBy(desc(conversation.updatedAt));
    return rows.map((r) => this.toEntity(r));
  }

  async updateTitle(id: string, title: string): Promise<void> {
    await this.db.update(conversation).set({ title }).where(eq(conversation.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(conversation).where(eq(conversation.id, id));
  }

  private toEntity(row: typeof conversation.$inferSelect): Conversation {
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
