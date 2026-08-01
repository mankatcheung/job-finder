import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('User', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('passwordHash'),
  name: text('name'),
  timezone: text('timezone'),
  targetRole: text('targetRole'),
  emailVerifiedAt: integer('emailVerifiedAt', { mode: 'timestamp_ms' }),
  avatarKey: text('avatarKey'),
  weeklyDigestEnabled: integer('weeklyDigestEnabled', { mode: 'boolean' }).notNull().default(true),
  lastDigestSentAt: integer('lastDigestSentAt', { mode: 'timestamp_ms' }),
  followUpRemindersEnabled: integer('followUpRemindersEnabled', { mode: 'boolean' })
    .notNull()
    .default(true),
  totpSecret: text('totpSecret'),
  totpEnabled: integer('totpEnabled', { mode: 'boolean' }).notNull().default(false),
  /** Which provider the user's own key below is for — see LLM_PROVIDER in constants.ts. */
  llmProvider: text('llmProvider'),
  /** User's own LLM API key, encrypted at rest (never returned to the client). */
  llmApiKey: text('llmApiKey'),
  /** Model override; required when llmProvider is 'custom', optional elsewhere. */
  llmModel: text('llmModel'),
  /** Base URL; only used (and required) when llmProvider is 'custom'. */
  llmBaseUrl: text('llmBaseUrl'),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const oauthAccount = sqliteTable(
  'OAuthAccount',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    email: text('email'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex('OAuthAccount_provider_providerAccountId_key').on(
      table.provider,
      table.providerAccountId,
    ),
    index('OAuthAccount_userId_idx').on(table.userId),
  ],
);

export const totpBackupCode = sqliteTable(
  'TotpBackupCode',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    codeHash: text('codeHash').notNull().unique(),
    usedAt: integer('usedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('TotpBackupCode_userId_idx').on(table.userId)],
);

export const loginEvent = sqliteTable(
  'LoginEvent',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('LoginEvent_userId_idx').on(table.userId)],
);

export const session = sqliteTable(
  'Session',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    userAgent: text('userAgent'),
    ipAddress: text('ipAddress'),
    lastUsedAt: integer('lastUsedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
    revokedAt: integer('revokedAt', { mode: 'timestamp_ms' }),
    currentRefreshTokenId: text('currentRefreshTokenId'),
    previousRefreshTokenId: text('previousRefreshTokenId'),
    previousRotatedAt: integer('previousRotatedAt', { mode: 'timestamp_ms' }),
  },
  (table) => [index('Session_userId_idx').on(table.userId)],
);

export const emailVerificationToken = sqliteTable(
  'EmailVerificationToken',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tokenHash: text('tokenHash').notNull().unique(),
    newEmail: text('newEmail'),
    expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
    usedAt: integer('usedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('EmailVerificationToken_userId_idx').on(table.userId)],
);

export const passwordResetToken = sqliteTable(
  'PasswordResetToken',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tokenHash: text('tokenHash').notNull().unique(),
    expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
    usedAt: integer('usedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('PasswordResetToken_userId_idx').on(table.userId)],
);

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
    lastUsedAt: integer('lastUsedAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('ApiToken_userId_idx').on(table.userId)],
);

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
    appliedAt: integer('appliedAt', { mode: 'timestamp_ms' }),
    starred: integer('starred', { mode: 'boolean' }).notNull().default(false),
    source: text('source'),
    followUpAt: integer('followUpAt', { mode: 'timestamp_ms' }),
    reminderSentAt: integer('reminderSentAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('JobApplication_userId_idx').on(table.userId),
    index('JobApplication_userId_status_idx').on(table.userId, table.status),
  ],
);

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
    uniqueIndex('ApplicationTag_applicationId_name_key').on(table.applicationId, table.name),
    index('ApplicationTag_applicationId_idx').on(table.applicationId),
  ],
);

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
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('ActivityLog_applicationId_idx').on(table.applicationId)],
);

export const interviewRound = sqliteTable(
  'InterviewRound',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    type: text('type').notNull().default('other'),
    scheduledAt: integer('scheduledAt', { mode: 'timestamp_ms' }),
    completedAt: integer('completedAt', { mode: 'timestamp_ms' }),
    interviewerName: text('interviewerName'),
    notes: text('notes'),
    outcome: text('outcome').notNull().default('pending'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('InterviewRound_applicationId_idx').on(table.applicationId)],
);

export const note = sqliteTable(
  'Note',
  {
    id: text('id').primaryKey(),
    applicationId: text('applicationId')
      .notNull()
      .references(() => jobApplication.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('Note_applicationId_idx').on(table.applicationId)],
);

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
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('Document_applicationId_idx').on(table.applicationId)],
);

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
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('Contact_applicationId_idx').on(table.applicationId)],
);
