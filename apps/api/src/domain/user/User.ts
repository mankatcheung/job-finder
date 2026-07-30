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
  totpSecret: string | null;
  totpEnabled: boolean;
  /** 'openrouter' | 'googleai' — which provider llmApiKey below is for. */
  llmProvider: string | null;
  /** User's own LLM API key, encrypted at rest. */
  llmApiKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}
