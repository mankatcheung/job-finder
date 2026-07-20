import type { PrismaClient } from '@prisma/client';
import type { ActivityLog } from '@/domain/activityLog/ActivityLog.js';
import type {
  IActivityLogRepository,
  AppendActivityLogData,
} from '@/use-cases/ports/IActivityLogRepository.js';
import { getClient } from '../transactionContext.js';

type PrismaActivityLog = {
  id: string;
  applicationId: string;
  actorId: string;
  eventType: string;
  payload: string;
  createdAt: Date;
};

interface Deps {
  prisma: PrismaClient;
}

export class PrismaActivityLogRepository implements IActivityLogRepository {
  constructor(private readonly deps: Deps) {}

  private get db(): PrismaClient {
    return getClient(this.deps.prisma);
  }

  async findAllByApplicationId(applicationId: string): Promise<ActivityLog[]> {
    const rows = await this.db.$queryRaw<PrismaActivityLog[]>`
      SELECT id, applicationId, actorId, eventType, payload, createdAt
      FROM ActivityLog
      WHERE applicationId = ${applicationId}
      ORDER BY createdAt DESC
    `;
    return rows.map((r) => this.toEntity(r));
  }

  async append(data: AppendActivityLogData): Promise<ActivityLog> {
    const now = new Date().toISOString();
    await this.db.$executeRaw`
      INSERT INTO ActivityLog (id, applicationId, actorId, eventType, payload, createdAt)
      VALUES (${data.id}, ${data.applicationId}, ${data.actorId}, ${data.eventType}, ${data.payload}, ${now})
    `;
    const rows = await this.db.$queryRaw<PrismaActivityLog[]>`
      SELECT id, applicationId, actorId, eventType, payload, createdAt
      FROM ActivityLog
      WHERE id = ${data.id}
    `;
    return this.toEntity(rows[0]);
  }

  private toEntity(row: PrismaActivityLog): ActivityLog {
    return {
      id: row.id,
      applicationId: row.applicationId,
      actorId: row.actorId,
      eventType: row.eventType as ActivityLog['eventType'],
      payload: row.payload,
      createdAt: new Date(row.createdAt),
    };
  }
}
