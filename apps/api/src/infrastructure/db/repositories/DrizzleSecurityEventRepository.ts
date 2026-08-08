import { eq, desc } from 'drizzle-orm';
import type { DrizzleDb, DrizzleClient } from '../client.js';
import { securityEvent } from '../schema.js';
import type { SecurityEvent, SecurityEventType } from '#src/domain/securityEvent/SecurityEvent.js';
import type {
  ISecurityEventRepository,
  CreateSecurityEventData,
} from '#src/use-cases/ports/ISecurityEventRepository.js';
import { getClient } from '../transactionContext.js';

export class DrizzleSecurityEventRepository implements ISecurityEventRepository {
  private readonly database: DrizzleDb;

  constructor({ db }: { db: DrizzleDb }) {
    this.database = db;
  }

  private get db(): DrizzleClient {
    return getClient(this.database);
  }

  async create(data: CreateSecurityEventData): Promise<SecurityEvent> {
    const [row] = await this.db.insert(securityEvent).values(data).returning();
    return this.toEntity(row);
  }

  async findRecentByUserId(userId: string, limit: number): Promise<SecurityEvent[]> {
    const rows = await this.db
      .select()
      .from(securityEvent)
      .where(eq(securityEvent.userId, userId))
      .orderBy(desc(securityEvent.createdAt))
      .limit(limit);
    return rows.map((r) => this.toEntity(r));
  }

  private toEntity(row: typeof securityEvent.$inferSelect): SecurityEvent {
    return {
      id: row.id,
      userId: row.userId,
      eventType: row.eventType as SecurityEventType,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.createdAt,
    };
  }
}
