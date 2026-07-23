import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const SCHEMA_STATEMENTS = [
  `CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "timezone" TEXT,
    "targetRole" TEXT,
    "emailVerifiedAt" DATETIME,
    "weeklyDigestEnabled" INTEGER NOT NULL DEFAULT 1,
    "followUpRemindersEnabled" INTEGER NOT NULL DEFAULT 1,
    "totpSecret" TEXT,
    "totpEnabled" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE "ApiToken" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "scope" TEXT NOT NULL DEFAULT 'full',
    "lastUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "ApiToken_userId_idx" ON "ApiToken"("userId")`,
  `CREATE TABLE "LoginEvent" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "LoginEvent_userId_idx" ON "LoginEvent"("userId")`,
  `CREATE TABLE "JobApplication" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "jobUrl" TEXT,
    "location" TEXT,
    "salaryRange" TEXT,
    "description" TEXT,
    "appliedAt" DATETIME,
    "starred" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,
    "followUpAt" DATETIME,
    "reminderSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "JobApplication_userId_idx" ON "JobApplication"("userId")`,
  `CREATE INDEX "JobApplication_userId_status_idx" ON "JobApplication"("userId", "status")`,
  `CREATE TABLE "InterviewRound" (
    "id" TEXT PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'other',
    "scheduledAt" DATETIME,
    "completedAt" DATETIME,
    "interviewerName" TEXT,
    "notes" TEXT,
    "outcome" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "InterviewRound_applicationId_idx" ON "InterviewRound"("applicationId")`,
  `CREATE TABLE "ActivityLog" (
    "id" TEXT PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "ActivityLog_applicationId_idx" ON "ActivityLog"("applicationId")`,
  `CREATE TABLE "Note" (
    "id" TEXT PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "Note_applicationId_idx" ON "Note"("applicationId")`,
  `CREATE TABLE "Document" (
    "id" TEXT PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL UNIQUE,
    "documentType" TEXT NOT NULL DEFAULT 'other',
    "version" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "Document_applicationId_idx" ON "Document"("applicationId")`,
  `CREATE TABLE "ApplicationTag" (
    "id" TEXT PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE
  )`,
  `CREATE UNIQUE INDEX "ApplicationTag_applicationId_name_key" ON "ApplicationTag"("applicationId", "name")`,
  `CREATE INDEX "ApplicationTag_applicationId_idx" ON "ApplicationTag"("applicationId")`,
  `CREATE TABLE "Contact" (
    "id" TEXT PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "Contact_applicationId_idx" ON "Contact"("applicationId")`,
  `CREATE TABLE "Session" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "Session_userId_idx" ON "Session"("userId")`,
  `CREATE TABLE "EmailVerificationToken" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId")`,
];

export interface TestDb {
  prisma: PrismaClient;
  cleanup: () => Promise<void>;
}

export async function createTestDb(): Promise<TestDb> {
  const dbPath = join(process.cwd(), `prisma/test-${randomUUID()}.db`);
  const adapter = new PrismaLibSQL({ url: `file:${dbPath}` });
  const prisma = new PrismaClient({ adapter, log: [] });

  for (const stmt of SCHEMA_STATEMENTS) {
    await prisma.$executeRawUnsafe(stmt);
  }

  return {
    prisma,
    cleanup: async () => {
      await prisma.$disconnect();
      if (existsSync(dbPath)) unlinkSync(dbPath);
    },
  };
}
