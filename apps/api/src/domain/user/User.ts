export interface User {
  id: string;
  email: string;
  /** Null for accounts created via OAuth sign-up that never set a password. */
  passwordHash: string | null;
  name: string | null;
  timezone: string | null;
  targetRole: string | null;
  emailVerifiedAt: Date | null;
  avatarKey: string | null;
  weeklyDigestEnabled: boolean;
  lastDigestSentAt: Date | null;
  followUpRemindersEnabled: boolean;
  pushNotificationsEnabled: boolean;
  totpSecret: string | null;
  totpEnabled: boolean;
  /** Which of the user's configured LlmApiKey providers is used for automatic AI features. */
  defaultLlmProvider: string | null;
  /** User-authored instruction spliced into the system prompt for AI-generated text (cover letters, chat assistant). */
  customAiPrompt: string | null;
  /** Secondary email for account recovery when primary inbox is inaccessible. */
  backupEmail: string | null;
  /** When the backup email was verified; null until verification completes. */
  backupEmailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
