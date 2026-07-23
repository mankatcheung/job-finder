import type { PrismaClient } from '@prisma/client';
import type { User } from '@/domain/user/User.js';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import { getClient } from '../transactionContext.js';

export class PrismaUserRepository implements IUserRepository {
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  private get db(): PrismaClient {
    return getClient(this.prisma);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.user.findUnique({ where: { email } });
    return row ? this.toEntity(row) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = await this.db.user.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map((r) => this.toEntity(r));
  }

  async create(data: { id: string; email: string; passwordHash: string }): Promise<User> {
    const row = await this.db.user.create({ data });
    return this.toEntity(row);
  }

  async update(
    id: string,
    data: {
      email?: string;
      passwordHash?: string;
      name?: string | null;
      timezone?: string | null;
      targetRole?: string | null;
    },
  ): Promise<User> {
    const row = await this.db.user.update({ where: { id }, data });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.user.delete({ where: { id } });
  }

  private toEntity(row: {
    id: string;
    email: string;
    passwordHash: string;
    name: string | null;
    timezone: string | null;
    targetRole: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      name: row.name,
      timezone: row.timezone,
      targetRole: row.targetRole,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
