import { eq, desc } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { LoginEvent } from '#src/domain/loginEvent/LoginEvent.js';
import type {
  ILoginEventRepository,
  CreateLoginEventData,
} from '#src/use-cases/ports/ILoginEventRepository.js';
import { loginEvent } from '../drizzle/schema.js';
import { getDb } from '../transactionContext.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleLoginEventRepository implements ILoginEventRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  private get database(): DrizzleDb {
    return getDb(this.db);
  }

  async create(data: CreateLoginEventData): Promise<LoginEvent> {
    const now = new Date();
    const row = {
      id: data.id,
      userId: data.userId,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      createdAt: now,
    };
    await this.database.insert(loginEvent).values(row);
    return this.toEntity(row);
  }

  async findRecentByUserId(userId: string, limit: number): Promise<LoginEvent[]> {
    const rows = await this.database
      .select()
      .from(loginEvent)
      .where(eq(loginEvent.userId, userId))
      .orderBy(desc(loginEvent.createdAt))
      .limit(limit);
    return rows.map(this.toEntity);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(row: any): LoginEvent {
    return {
      id: row.id,
      userId: row.userId,
      ipAddress: row.ipAddress ?? null,
      userAgent: row.userAgent ?? null,
      createdAt: row.createdAt,
    };
  }
}
