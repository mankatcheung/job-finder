export interface User {
  id: string;
  email: string;
  /** Null for accounts created via OAuth sign-up that never set a password. */
  passwordHash: string | null;
  name: string | null;
  timezone: string | null;
  targetRole: string | null;
  emailVerifiedAt: Date | null;
  weeklyDigestEnabled: boolean;
  lastDigestSentAt: Date | null;
  followUpRemindersEnabled: boolean;
  totpSecret: string | null;
  totpEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
