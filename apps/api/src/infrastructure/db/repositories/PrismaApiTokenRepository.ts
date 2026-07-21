import type { PrismaClient } from '@prisma/client';
import type { ApiToken, ApiTokenScope } from '@/domain/apiToken/ApiToken.js';
import { getClient } from '../transactionContext.js';
import type {
  IApiTokenRepository,
  CreateApiTokenData,
} from '@/use-cases/ports/IApiTokenRepository.js';

type PrismaToken = {
  id: string;
  userId: string;
  name: string;
  tokenHash: string;
  scope: string;
  lastUsedAt: Date | null;
  createdAt: Date;
};

export class PrismaApiTokenRepository implements IApiTokenRepository {
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  private get db(): PrismaClient {
    return getClient(this.prisma);
  }

  async findAllByUserId(userId: string): Promise<ApiToken[]> {
    const rows = await this.db.apiToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.toEntity);
  }

  async findByTokenHash(tokenHash: string): Promise<{ token: ApiToken; userEmail: string } | null> {
    const row = await this.db.apiToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { email: true } } },
    });
    if (!row) return null;
    return { token: this.toEntity(row), userEmail: row.user.email };
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ApiToken | null> {
    const row = await this.db.apiToken.findFirst({ where: { id, userId } });
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateApiTokenData): Promise<ApiToken> {
    const row = await this.db.apiToken.create({
      data: {
        id: data.id,
        userId: data.userId,
        name: data.name,
        tokenHash: data.tokenHash,
        scope: data.scope,
      },
    });
    return this.toEntity(row);
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.db.apiToken.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.apiToken.delete({ where: { id } });
  }

  private toEntity(row: PrismaToken): ApiToken {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      tokenHash: row.tokenHash,
      scope: (row.scope as ApiTokenScope) ?? 'full',
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
    };
  }
}
