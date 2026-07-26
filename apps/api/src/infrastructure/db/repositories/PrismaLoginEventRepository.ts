import type { PrismaClient } from '@prisma/client';
import type { LoginEvent } from '#src/domain/loginEvent/LoginEvent.js';
import type {
  ILoginEventRepository,
  CreateLoginEventData,
} from '#src/use-cases/ports/ILoginEventRepository.js';
import { getClient } from '../transactionContext.js';

type PrismaLoginEvent = {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export class PrismaLoginEventRepository implements ILoginEventRepository {
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  private get db(): PrismaClient {
    return getClient(this.prisma);
  }

  async create(data: CreateLoginEventData): Promise<LoginEvent> {
    const row = await this.db.loginEvent.create({ data });
    return this.toEntity(row);
  }

  async findRecentByUserId(userId: string, limit: number): Promise<LoginEvent[]> {
    const rows = await this.db.loginEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(this.toEntity);
  }

  private toEntity(row: PrismaLoginEvent): LoginEvent {
    return {
      id: row.id,
      userId: row.userId,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.createdAt,
    };
  }
}
