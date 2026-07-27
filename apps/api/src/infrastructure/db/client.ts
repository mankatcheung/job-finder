import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '#src/generated/prisma/client.js';
import { ENV } from '#src/constants.js';

const adapter = new PrismaLibSql({
  url: process.env[ENV.DATABASE_URL]!,
  authToken: process.env[ENV.DATABASE_AUTH_TOKEN] ?? undefined,
});

export const prisma = new PrismaClient({ adapter });

export type PrismaClientType = typeof prisma;
