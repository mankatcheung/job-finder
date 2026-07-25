import type { PrismaClient } from '@prisma/client';
import type { EmailVerificationToken } from '@/domain/emailVerificationToken/EmailVerificationToken.js';
import type { IEmailVerificationTokenRepository } from '@/use-cases/ports/IEmailVerificationTokenRepository.js';
import { getClient } from '../transactionContext.js';

type PrismaEmailVerificationToken = {
  id: string;
  userId: string;
  tokenHash: string;
  newEmail: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export class PrismaEmailVerificationTokenRepository implements IEmailVerificationTokenRepository {
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
    newEmail?: string;
    expiresAt: Date;
  }): Promise<EmailVerificationToken> {
    const row = await this.db.emailVerificationToken.create({ data });
    return this.toEntity(row);
  }

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    const row = await this.db.emailVerificationToken.findUnique({ where: { tokenHash } });
    return row ? this.toEntity(row) : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.db.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.db.emailVerificationToken.deleteMany({ where: { userId } });
  }

  private toEntity(row: PrismaEmailVerificationToken): EmailVerificationToken {
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      newEmail: row.newEmail,
      expiresAt: row.expiresAt,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    };
  }
}
