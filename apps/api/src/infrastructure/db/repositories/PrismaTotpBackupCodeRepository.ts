import type { PrismaClient } from '@prisma/client';
import type { TotpBackupCode } from '@/domain/totpBackupCode/TotpBackupCode.js';
import type { ITotpBackupCodeRepository } from '@/use-cases/ports/ITotpBackupCodeRepository.js';
import { getClient } from '../transactionContext.js';

type PrismaTotpBackupCode = {
  id: string;
  userId: string;
  codeHash: string;
  usedAt: Date | null;
  createdAt: Date;
};

export class PrismaTotpBackupCodeRepository implements ITotpBackupCodeRepository {
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  private get db(): PrismaClient {
    return getClient(this.prisma);
  }

  async create(data: { id: string; userId: string; codeHash: string }): Promise<TotpBackupCode> {
    const row = await this.db.totpBackupCode.create({ data });
    return this.toEntity(row);
  }

  async findByCodeHash(codeHash: string): Promise<TotpBackupCode | null> {
    const row = await this.db.totpBackupCode.findUnique({ where: { codeHash } });
    return row ? this.toEntity(row) : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.db.totpBackupCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await this.db.totpBackupCode.deleteMany({ where: { userId } });
  }

  private toEntity(row: PrismaTotpBackupCode): TotpBackupCode {
    return {
      id: row.id,
      userId: row.userId,
      codeHash: row.codeHash,
      usedAt: row.usedAt,
      createdAt: row.createdAt,
    };
  }
}
