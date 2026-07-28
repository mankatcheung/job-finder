import { eq, desc } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type { ActivityLog } from '#src/domain/activityLog/ActivityLog.js';
import type {
  IActivityLogRepository,
  AppendActivityLogData,
} from '#src/use-cases/ports/IActivityLogRepository.js';
import { activityLog } from '../drizzle/schema.js';
import { getDb } from '../transactionContext.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleDb = BaseSQLiteDatabase<any, any>;

export class DrizzleActivityLogRepository implements IActivityLogRepository {
  private readonly db: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.db = db;
  }

  private get database(): DrizzleDb {
    return getDb(this.db);
  }

  async findAllByApplicationId(applicationId: string): Promise<ActivityLog[]> {
    const rows = await this.database
      .select()
      .from(activityLog)
      .where(eq(activityLog.applicationId, applicationId))
      .orderBy(desc(activityLog.createdAt));
    return rows.map(this.toEntity);
  }

  async append(data: AppendActivityLogData): Promise<ActivityLog> {
    const now = new Date();
    const row = {
      id: data.id,
      applicationId: data.applicationId,
      actorId: data.actorId,
      eventType: data.eventType,
      payload: data.payload,
      createdAt: now,
    };
    await this.database.insert(activityLog).values(row);
    return this.toEntity(row);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(row: any): ActivityLog {
    return {
      id: row.id,
      applicationId: row.applicationId,
      actorId: row.actorId,
      eventType: row.eventType as ActivityLog['eventType'],
      payload: row.payload,
      createdAt: row.createdAt,
    };
  }
}
