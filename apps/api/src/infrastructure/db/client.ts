import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaLibSQL({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN ?? undefined,
});

export const prisma = new PrismaClient({ adapter });

export type PrismaClientType = typeof prisma;
