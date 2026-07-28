import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------
export const user = sqliteTable(
  'User',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('passwordHash'),
    name: text('name'),
    timezone: text('timezone'),
    targetRole: text('targetRole'),
    emailVerifiedAt: integer('emailVerifiedAt', { mode: 'timestamp' }),
    avatarKey: text('avatarKey'),
    weeklyDigestEnabled: integer('weeklyDigestEnabled', { mode: 'boolean' })
      .notNull()
      .default(true),
    lastDigestSentAt: integer('lastDigestSentAt', { mode: 'timestamp' }),
    followUpRemindersEnabled: integer('followUpRemindersEnabled', { mode: 'boolean' })
      .notNull()
      .default(true),
    totpSecret: text('totpSecret'),
    totpEnabled: integer('totpEnabled', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_user_email').on(table.email)],
);

// ---------------------------------------------------------------------------
// OAuthAccount
// ---------------------------------------------------------------------------
export const oAuthAccount = sqliteTable(
  'OAuthAccount',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    email: text('email'),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('idx_oauth_account_user_id').on(table.userId),
    index('idx_oauth_account_provider_providerAccountId').on(
      table.provider,
      table.providerAccountId,
    ),
  ],
);

// ---------------------------------------------------------------------------
// TotpBackupCode
// ---------------------------------------------------------------------------
export const totpBackupCode = sqliteTable(
  'TotpBackupCode',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    codeHash: text('codeHash').notNull().unique(),
    usedAt: integer('usedAt', { mode: 'timestamp' }),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_totp_backup_code_user_id').on(table.userId)],
);

// ---------------------------------------------------------------------------
// LoginEvent
// ---------------------------------------------------------------------------
export const loginEvent = sqliteTable(
  'LoginEvent',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_login_event_user_id').on(table.userId)],
);

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
export const session = sqliteTable(
  'Session',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userAgent: text('userAgent'),
    ipAddress: text('ipAddress'),
    lastUsedAt: integer('lastUsedAt', { mode: 'timestamp' }).notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
    revokedAt: integer('revokedAt', { mode: 'timestamp' }),
  },
  (table) => [index('idx_session_user_id').on(table.userId)],
);

// ---------------------------------------------------------------------------
// EmailVerificationToken
// ---------------------------------------------------------------------------
export const emailVerificationToken = sqliteTable(
  'EmailVerificationToken',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tokenHash: text('tokenHash').notNull().unique(),
    newEmail: text('newEmail'),
    expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
    usedAt: integer('usedAt', { mode: 'timestamp' }),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_email_verification_token_user_id').on(table.userId)],
);

// ---------------------------------------------------------------------------
// PasswordResetToken
// ---------------------------------------------------------------------------
export const passwordResetToken = sqliteTable(
  'PasswordResetToken',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tokenHash: text('tokenHash').notNull().unique(),
    expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
    usedAt: integer('usedAt', { mode: 'timestamp' }),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_password_reset_token_user_id').on(table.userId)],
);

// ---------------------------------------------------------------------------
// ApiToken
// ---------------------------------------------------------------------------
export const apiToken = sqliteTable(
  'ApiToken',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    tokenHash: text('tokenHash').notNull().unique(),
    scope: text('scope').notNull().default('full'),
    lastUsedAt: integer('lastUsedAt', { mode: 'timestamp' }),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_api_token_user_id').on(table.userId)],
);

// ---------------------------------------------------------------------------
// JobApplication
// ---------------------------------------------------------------------------
export const jobApplication = sqliteTable(
  'JobApplication',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    company: text('company').notNull(),
    role: text('role').notNull(),
    status: text('status').notNull().default('draft'),
    jobUrl: text('jobUrl'),
    location: text('location'),
    salaryRange: text('salaryRange'),
    description: text('description'),
    appliedAt: integer('appliedAt', { mode: 'timestamp' }),
    starred: integer('starred', { mode: 'boolean' }).notNull().default(false),
    source: text('source'),
    followUpAt: integer('followUpAt', { mode: 'timestamp' }),
    reminderSentAt: integer('reminderSentAt', { mode: 'timestamp' }),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [
    index('idx_job_application_user_id').on(table.userId),
    index('idx_job_application_user_status').on(table.userId, table.status),
  ],
);

// ---------------------------------------------------------------------------
// ApplicationTag
// ---------------------------------------------------------------------------
export const applicationTag = sqliteTable(
  'ApplicationTag',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
  },
  (table) => [
    index('idx_application_tag_application_id').on(table.applicationId),
    index('idx_application_tag_application_id_name').on(table.applicationId, table.name),
  ],
);

// ---------------------------------------------------------------------------
// ActivityLog
// ---------------------------------------------------------------------------
export const activityLog = sqliteTable(
  'ActivityLog',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    actorId: text('actorId').notNull(),
    eventType: text('eventType').notNull(),
    payload: text('payload').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_activity_log_application_id').on(table.applicationId)],
);

// ---------------------------------------------------------------------------
// InterviewRound
// ---------------------------------------------------------------------------
export const interviewRound = sqliteTable(
  'InterviewRound',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    type: text('type').notNull().default('other'),
    scheduledAt: integer('scheduledAt', { mode: 'timestamp' }),
    completedAt: integer('completedAt', { mode: 'timestamp' }),
    interviewerName: text('interviewerName'),
    notes: text('notes'),
    outcome: text('outcome').notNull().default('pending'),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_interview_round_application_id').on(table.applicationId)],
);

// ---------------------------------------------------------------------------
// Note
// ---------------------------------------------------------------------------
export const note = sqliteTable(
  'Note',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_note_application_id').on(table.applicationId)],
);

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export const document = sqliteTable(
  'Document',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    mimeType: text('mimeType').notNull(),
    sizeBytes: integer('sizeBytes').notNull(),
    storageKey: text('storageKey').notNull().unique(),
    documentType: text('documentType').notNull().default('other'),
    version: text('version'),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_document_application_id').on(table.applicationId)],
);

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------
export const contact = sqliteTable(
  'Contact',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    role: text('role'),
    email: text('email'),
    phone: text('phone'),
    linkedinUrl: text('linkedinUrl'),
    notes: text('notes'),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_contact_application_id').on(table.applicationId)],
);
