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
  pushNotificationsEnabled: integer('pushNotificationsEnabled', { mode: 'boolean' })
    .notNull()
    .default(false),
  totpSecret: text('totpSecret'),
  totpEnabled: integer('totpEnabled', { mode: 'boolean' }).notNull().default(false),
  /**
   * Which of the user's configured LlmApiKey rows (see below) is used for
   * automatic AI features (cover letter, JD parsing, resume match) — the
   * assistant chooses its own provider per-conversation instead.
   */
  defaultLlmProvider: text('defaultLlmProvider'),
  /** User-authored instruction spliced into the system prompt for AI-generated text (cover letters, chat assistant). */
  customAiPrompt: text('customAiPrompt'),
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

export const llmApiKey = sqliteTable(
  'LlmApiKey',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** See LLM_PROVIDER in constants.ts. One row per user per provider. */
    provider: text('provider').notNull(),
    /** Encrypted at rest (never returned to the client). */
    apiKey: text('apiKey').notNull(),
    /** Model override; required when provider is 'custom', optional elsewhere. */
    model: text('model'),
    /** Base URL; only used (and required) when provider is 'custom'. */
    baseUrl: text('baseUrl'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('LlmApiKey_userId_idx').on(table.userId),
    uniqueIndex('LlmApiKey_userId_provider_key').on(table.userId, table.provider),
  ],
);

export const conversation = sqliteTable(
  'Conversation',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** Auto-derived from the first message once sent; null for a brand-new empty conversation. */
    title: text('title'),
    /**
     * The provider/model this conversation uses — set once (at creation or
     * on the first message) and then locked for the life of the
     * conversation, so a single thread never mixes providers mid-way.
     */
    llmProvider: text('llmProvider'),
    llmModel: text('llmModel'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('Conversation_userId_idx').on(table.userId)],
);

export const message = sqliteTable(
  'Message',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversationId')
      .notNull()
      .references(() => conversation.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant'] }).notNull(),
    content: text('content').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('Message_conversationId_idx').on(table.conversationId)],
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
    deviceLabel: text('deviceLabel'),
    location: text('location'),
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
    pushNotificationSentAt: integer('pushNotificationSentAt', { mode: 'timestamp_ms' }),
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

export const pushSubscription = sqliteTable(
  'PushSubscription',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull().unique(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('PushSubscription_userId_idx').on(table.userId)],
);

export const notification = sqliteTable(
  'Notification',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** See NOTIFICATION_TYPE in constants.ts — drives which icon the inbox shows. */
    type: text('type', {
      enum: ['interview_reminder', 'follow_up_reminder', 'security_alert'],
    }).notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    /** Where clicking the notification navigates to; null if not actionable. */
    url: text('url'),
    /** Null = unread. Set to the time the user marked it read. */
    readAt: integer('readAt', { mode: 'timestamp_ms' }),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('Notification_userId_idx').on(table.userId),
    index('Notification_userId_readAt_idx').on(table.userId, table.readAt),
  ],
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

export const workExperience = sqliteTable(
  'WorkExperience',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    company: text('company').notNull(),
    title: text('title').notNull(),
    location: text('location'),
    startDate: integer('startDate', { mode: 'timestamp_ms' }).notNull(),
    endDate: integer('endDate', { mode: 'timestamp_ms' }),
    description: text('description'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('WorkExperience_userId_idx').on(table.userId)],
);

export const education = sqliteTable(
  'Education',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    institution: text('institution').notNull(),
    degree: text('degree'),
    field: text('field'),
    startDate: integer('startDate', { mode: 'timestamp_ms' }).notNull(),
    endDate: integer('endDate', { mode: 'timestamp_ms' }),
    description: text('description'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => [index('Education_userId_idx').on(table.userId)],
);

export const skill = sqliteTable(
  'Skill',
  {
    id: text('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category'),
    proficiency: text('proficiency'),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('Skill_userId_idx').on(table.userId)],
);
