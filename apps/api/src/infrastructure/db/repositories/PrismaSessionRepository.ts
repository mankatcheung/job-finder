import type { PrismaClient } from '@prisma/client';
import type { Session } from '@/domain/session/Session.js';
import { getClient } from '../transactionContext.js';
import type {
  ISessionRepository,
  CreateSessionData,
} from '@/use-cases/ports/ISessionRepository.js';

type PrismaSession = {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: Date;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
};

export class PrismaSessionRepository implements ISessionRepository {
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  private get db(): PrismaClient {
    return getClient(this.prisma);
  }

  async create(data: CreateSessionData): Promise<Session> {
    const row = await this.db.session.create({ data });
    return this.toEntity(row);
  }

  async findById(id: string): Promise<Session | null> {
    const row = await this.db.session.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Session | null> {
    const row = await this.db.session.findFirst({ where: { id, userId } });
    return row ? this.toEntity(row) : null;
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    const rows = await this.db.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async touch(id: string, expiresAt: Date): Promise<void> {
    await this.db.session.update({ where: { id }, data: { lastUsedAt: new Date(), expiresAt } });
  }

  async revoke(id: string): Promise<void> {
    await this.db.session.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  async revokeAllForUserExcept(userId: string, exceptId: string): Promise<void> {
    await this.db.session.updateMany({
      where: { userId, id: { not: exceptId }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private toEntity(row: PrismaSession): Session {
    return {
      id: row.id,
      userId: row.userId,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
    };
  }
}
