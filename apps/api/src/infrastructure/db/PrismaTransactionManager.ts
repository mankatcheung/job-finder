import type { PrismaClient } from '@prisma/client';
import type { ITransactionManager } from '@/use-cases/ports/ITransactionManager.js';
import { txStorage } from './transactionContext.js';

export class PrismaTransactionManager implements ITransactionManager {
  private readonly prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    this.prisma = prisma;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (txStorage.getStore()) return fn();
    return this.prisma.$transaction((tx) => txStorage.run(tx, fn));
  }
}
