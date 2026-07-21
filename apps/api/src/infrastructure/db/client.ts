import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';
import { ENV } from '@/constants.js';

const adapter = new PrismaLibSQL({
  url: process.env[ENV.DATABASE_URL]!,
  authToken: process.env[ENV.DATABASE_AUTH_TOKEN] ?? undefined,
});

export const prisma = new PrismaClient({ adapter });

export type PrismaClientType = typeof prisma;
