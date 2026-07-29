import { eq, desc } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { loginEvent } from '../schema.js';
import type { LoginEvent } from '#src/domain/loginEvent/LoginEvent.js';
import type {
  ILoginEventRepository,
  CreateLoginEventData,
} from '#src/use-cases/ports/ILoginEventRepository.js';
import { getClient } from '../transactionContext.js';

export class DrizzleLoginEventRepository implements ILoginEventRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async create(data: CreateLoginEventData): Promise<LoginEvent> {
    const [row] = await this.db.insert(loginEvent).values(data).returning();
    return this.toEntity(row);
  }

  async findRecentByUserId(userId: string, limit: number): Promise<LoginEvent[]> {
    const rows = await this.db
      .select()
      .from(loginEvent)
      .where(eq(loginEvent.userId, userId))
      .orderBy(desc(loginEvent.createdAt))
      .limit(limit);
    return rows.map((r) => this.toEntity(r));
  }

  private toEntity(row: typeof loginEvent.$inferSelect): LoginEvent {
    return {
      id: row.id,
      userId: row.userId,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.createdAt,
    };
  }
}
