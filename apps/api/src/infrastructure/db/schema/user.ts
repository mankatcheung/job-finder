import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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
  digestFrequency: text('digestFrequency').notNull().default('weekly'),
  lastDigestSentAt: integer('lastDigestSentAt', { mode: 'timestamp_ms' }),
  followUpRemindersEnabled: integer('followUpRemindersEnabled', { mode: 'boolean' })
    .notNull()
    .default(true),
  pushNotificationsEnabled: integer('pushNotificationsEnabled', { mode: 'boolean' })
    .notNull()
    .default(false),
  weeklyApplicationGoal: integer('weeklyApplicationGoal').notNull().default(5),
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
  /** Secondary email for account recovery when primary inbox is inaccessible. */
  backupEmail: text('backupEmail'),
  /** When the backup email was verified; null until verification completes. */
  backupEmailVerifiedAt: integer('backupEmailVerifiedAt', { mode: 'timestamp_ms' }),
  createdAt: integer('createdAt', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});
