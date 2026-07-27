import { AsyncLocalStorage } from 'node:async_hooks';
import type { Prisma, PrismaClient } from '#src/generated/prisma/client.js';

export const txStorage = new AsyncLocalStorage<Prisma.TransactionClient>();

export function getClient(prisma: PrismaClient): PrismaClient {
  return (txStorage.getStore() ?? prisma) as PrismaClient;
}
