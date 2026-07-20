import { AsyncLocalStorage } from 'node:async_hooks';
import type { Prisma, PrismaClient } from '@prisma/client';

export const txStorage = new AsyncLocalStorage<Prisma.TransactionClient>();

export function getClient(prisma: PrismaClient): PrismaClient {
  return (txStorage.getStore() ?? prisma) as PrismaClient;
}
