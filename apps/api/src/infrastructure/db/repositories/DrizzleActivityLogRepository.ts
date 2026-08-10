import { eq, asc, desc } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { activityLog, jobApplication } from '../schema.js';
import type { ActivityLog } from '#src/domain/activityLog/ActivityLog.js';
import type {
  IActivityLogRepository,
  AppendActivityLogData,
} from '#src/use-cases/ports/IActivityLogRepository.js';
import { getClient } from '../transactionContext.js';

export class DrizzleActivityLogRepository implements IActivityLogRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async findAllByApplicationId(applicationId: string): Promise<ActivityLog[]> {
    const rows = await this.db
      .select()
      .from(activityLog)
      .where(eq(activityLog.applicationId, applicationId))
      .orderBy(desc(activityLog.createdAt));
    return rows.map((r) => this.toEntity(r));
  }

  async findAllByUserId(userId: string): Promise<ActivityLog[]> {
    const rows = await this.db
      .select({ activityLog })
      .from(activityLog)
      .innerJoin(jobApplication, eq(activityLog.applicationId, jobApplication.id))
      .where(eq(jobApplication.userId, userId))
      .orderBy(asc(activityLog.createdAt));
    return rows.map((r) => this.toEntity(r.activityLog));
  }

  async append(data: AppendActivityLogData): Promise<ActivityLog> {
    const [row] = await this.db.insert(activityLog).values(data).returning();
    return this.toEntity(row);
  }

  private toEntity(row: typeof activityLog.$inferSelect): ActivityLog {
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
