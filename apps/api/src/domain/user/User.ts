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
  /** Which provider llmApiKey below is for — see LLM_PROVIDER in constants.ts. */
  llmProvider: string | null;
  /** User's own LLM API key, encrypted at rest. */
  llmApiKey: string | null;
  /** Model override; required when llmProvider is 'custom', optional elsewhere. */
  llmModel: string | null;
  /** Base URL; only used (and required) when llmProvider is 'custom'. */
  llmBaseUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
