import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import * as schema from '#src/infrastructure/db/schema.js';
import type { DrizzleDb } from '#src/infrastructure/db/client.js';

const SCHEMA_STATEMENTS = [
  `CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT,
    "name" TEXT,
    "timezone" TEXT,
    "targetRole" TEXT,
    "emailVerifiedAt" INTEGER,
    "avatarKey" TEXT,
    "weeklyDigestEnabled" INTEGER NOT NULL DEFAULT 1,
    "digestFrequency" TEXT NOT NULL DEFAULT 'weekly',
    "lastDigestSentAt" INTEGER,
    "followUpRemindersEnabled" INTEGER NOT NULL DEFAULT 1,
    "pushNotificationsEnabled" INTEGER NOT NULL DEFAULT 0,
    "weeklyApplicationGoal" INTEGER NOT NULL DEFAULT 5,
    "applicationCount" INTEGER NOT NULL DEFAULT 0,
    "totpSecret" TEXT,
    "totpEnabled" INTEGER NOT NULL DEFAULT 0,
    "defaultLlmProvider" TEXT,
    "customAiPrompt" TEXT,
    "backupEmail" TEXT,
    "backupEmailVerifiedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL
  )`,
  `CREATE TABLE "LlmApiKey" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "model" TEXT,
    "baseUrl" TEXT,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "LlmApiKey_userId_idx" ON "LlmApiKey"("userId")`,
  `CREATE UNIQUE INDEX "LlmApiKey_userId_provider_key" ON "LlmApiKey"("userId", "provider")`,
  `CREATE TABLE "ApiToken" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "scope" TEXT NOT NULL DEFAULT 'full',
    "lastUsedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "ApiToken_userId_idx" ON "ApiToken"("userId")`,
  `CREATE TABLE "McpOAuthAccessToken" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "scope" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "revokedAt" INTEGER,
    "lastUsedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "McpOAuthAccessToken_userId_idx" ON "McpOAuthAccessToken"("userId")`,
  `CREATE INDEX "McpOAuthAccessToken_clientId_idx" ON "McpOAuthAccessToken"("clientId")`,
  `CREATE INDEX "McpOAuthAccessToken_familyId_idx" ON "McpOAuthAccessToken"("familyId")`,
  `CREATE INDEX "McpOAuthAccessToken_expiresAt_idx" ON "McpOAuthAccessToken"("expiresAt")`,
  `CREATE TABLE "McpOAuthClient" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "redirectUris" TEXT NOT NULL,
    "revokedAt" INTEGER,
    "createdAt" INTEGER NOT NULL
  )`,
  `CREATE INDEX "McpOAuthClient_createdAt_idx" ON "McpOAuthClient"("createdAt")`,
  `CREATE TABLE "McpOAuthAuthorizationCode" (
    "id" TEXT PRIMARY KEY,
    "codeHash" TEXT NOT NULL UNIQUE,
    "familyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "codeChallenge" TEXT NOT NULL,
    "codeChallengeMethod" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "consumedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("clientId") REFERENCES "McpOAuthClient"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "McpOAuthAuthorizationCode_clientId_idx" ON "McpOAuthAuthorizationCode"("clientId")`,
  `CREATE INDEX "McpOAuthAuthorizationCode_familyId_idx" ON "McpOAuthAuthorizationCode"("familyId")`,
  `CREATE INDEX "McpOAuthAuthorizationCode_userId_idx" ON "McpOAuthAuthorizationCode"("userId")`,
  `CREATE INDEX "McpOAuthAuthorizationCode_expiresAt_idx" ON "McpOAuthAuthorizationCode"("expiresAt")`,
  `CREATE TABLE "McpOAuthRefreshToken" (
    "id" TEXT PRIMARY KEY,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "familyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "usedAt" INTEGER,
    "revokedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "McpOAuthRefreshToken_familyId_idx" ON "McpOAuthRefreshToken"("familyId")`,
  `CREATE INDEX "McpOAuthRefreshToken_userId_idx" ON "McpOAuthRefreshToken"("userId")`,
  `CREATE INDEX "McpOAuthRefreshToken_expiresAt_idx" ON "McpOAuthRefreshToken"("expiresAt")`,
  `CREATE TABLE "ShareLink" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "lastUsedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "ShareLink_userId_idx" ON "ShareLink"("userId")`,
  `CREATE TABLE "LoginEvent" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "LoginEvent_userId_idx" ON "LoginEvent"("userId")`,
  `CREATE TABLE "SecurityEvent" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId")`,
  `CREATE TABLE "Conversation" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "llmProvider" TEXT,
    "llmModel" TEXT,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId")`,
  `CREATE TABLE "Message" (
    "id" TEXT PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId")`,
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
    "appliedAt" INTEGER,
    "starred" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,
    "followUpAt" INTEGER,
    "reminderSentAt" INTEGER,
    "boardPosition" INTEGER NOT NULL DEFAULT 0,
    "documentCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "JobApplication_userId_idx" ON "JobApplication"("userId")`,
  `CREATE INDEX "JobApplication_userId_status_idx" ON "JobApplication"("userId", "status")`,
  `CREATE TABLE "InterviewRound" (
    "id" TEXT PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'other',
    "scheduledAt" INTEGER,
    "completedAt" INTEGER,
    "interviewerName" TEXT,
    "notes" TEXT,
    "outcome" TEXT NOT NULL DEFAULT 'pending',
    "pushNotificationSentAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "InterviewRound_applicationId_idx" ON "InterviewRound"("applicationId")`,
  `CREATE TABLE "ActivityLog" (
    "id" TEXT PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "ActivityLog_applicationId_idx" ON "ActivityLog"("applicationId")`,
  `CREATE TABLE "Note" (
    "id" TEXT PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
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
    "sourceDraftId" TEXT,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE,
    FOREIGN KEY ("sourceDraftId") REFERENCES "DocumentDraft"("id") ON DELETE SET NULL
  )`,
  `CREATE INDEX "Document_applicationId_idx" ON "Document"("applicationId")`,
  `CREATE TABLE "Offer" (
    "id" TEXT PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "bonus" INTEGER,
    "equity" TEXT,
    "benefits" TEXT,
    "costOfLivingAdjustment" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "period" TEXT NOT NULL DEFAULT 'yearly',
    "notes" TEXT,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "Offer_applicationId_idx" ON "Offer"("applicationId")`,
  `CREATE TABLE "DocumentDraft" (
    "id" TEXT PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentJson" TEXT DEFAULT '{}' NOT NULL,
    "plainText" TEXT DEFAULT '' NOT NULL,
    "sourceDocumentId" TEXT,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE,
    FOREIGN KEY ("sourceDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL
  )`,
  `CREATE INDEX "DocumentDraft_applicationId_idx" ON "DocumentDraft"("applicationId")`,
  `CREATE INDEX "DocumentDraft_sourceDocumentId_idx" ON "DocumentDraft"("sourceDocumentId")`,
  `CREATE TABLE "CompanyBriefing" (
    "id" TEXT PRIMARY KEY,
    "applicationId" TEXT NOT NULL UNIQUE,
    "content" TEXT NOT NULL,
    "generatedAt" INTEGER NOT NULL,
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE
  )`,
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
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "Contact_applicationId_idx" ON "Contact"("applicationId")`,
  `CREATE TABLE "Session" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "deviceLabel" TEXT,
    "location" TEXT,
    "lastUsedAt" INTEGER NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "revokedAt" INTEGER,
    "currentRefreshTokenId" TEXT,
    "previousRefreshTokenId" TEXT,
    "previousRotatedAt" INTEGER,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "Session_userId_idx" ON "Session"("userId")`,
  `CREATE TABLE "EmailVerificationToken" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "newEmail" TEXT,
    "expiresAt" INTEGER NOT NULL,
    "usedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId")`,
  `CREATE TABLE "TotpBackupCode" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL UNIQUE,
    "usedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "TotpBackupCode_userId_idx" ON "TotpBackupCode"("userId")`,
  `CREATE TABLE "PasswordResetToken" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "expiresAt" INTEGER NOT NULL,
    "usedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId")`,
  `CREATE TABLE "OAuthAccount" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId")`,
  `CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount"("provider", "providerAccountId")`,
  `CREATE TABLE "PushSubscription" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL UNIQUE,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId")`,
  `CREATE TABLE "Notification" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "readAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "Notification_userId_idx" ON "Notification"("userId")`,
  `CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt")`,
  `CREATE TABLE "BackupEmailVerificationToken" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "newBackupEmail" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "usedAt" INTEGER,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "BackupEmailVerificationToken_userId_idx" ON "BackupEmailVerificationToken"("userId")`,
  `CREATE TABLE "Education" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT,
    "field" TEXT,
    "startDate" INTEGER NOT NULL,
    "endDate" INTEGER,
    "description" TEXT,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "Education_userId_idx" ON "Education"("userId")`,
  `CREATE TABLE "Skill" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "proficiency" TEXT,
    "createdAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "Skill_userId_idx" ON "Skill"("userId")`,
  `CREATE TABLE "WorkExperience" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "startDate" INTEGER NOT NULL,
    "endDate" INTEGER,
    "description" TEXT,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,
  `CREATE INDEX "WorkExperience_userId_idx" ON "WorkExperience"("userId")`,
];

export interface TestDb {
  db: DrizzleDb;
  cleanup: () => Promise<void>;
}

export async function createTestDb(): Promise<TestDb> {
  const dbPath = join(tmpdir(), `trakwyn-test-${randomUUID()}.db`);
  const client = createClient({ url: `file:${dbPath}` });
  await client.execute('PRAGMA foreign_keys = ON');

  for (const stmt of SCHEMA_STATEMENTS) {
    await client.execute(stmt);
  }

  const db = drizzle(client, { schema }) as DrizzleDb;

  return {
    db,
    cleanup: async () => {
      client.close();
      if (existsSync(dbPath)) unlinkSync(dbPath);
    },
  };
}
