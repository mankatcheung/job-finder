import type { PrismaClient } from '@prisma/client';
import type { PasswordResetToken } from '@/domain/passwordResetToken/PasswordResetToken.js';
import type { IPasswordResetTokenRepository } from '@/use-cases/ports/IPasswordResetTokenRepository.js';
import { getClient } from '../transactionContext.js';

type PrismaPasswordResetToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  private get db(): PrismaClient {
    return getClient(this.prisma);
  }

  async create(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    const row = await this.db.passwordResetToken.create({ data });
    return this.toEntity(row);
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const row = await this.db.passwordResetToken.findUnique({ where: { tokenHash } });
    return row ? this.toEntity(row) : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.db.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.db.passwordResetToken.deleteMany({ where: { userId } });
  }

  private toEntity(row: PrismaPasswordResetToken): PasswordResetToken {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    };
  }
}
