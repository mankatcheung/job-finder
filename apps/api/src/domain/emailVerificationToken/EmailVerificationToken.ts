export interface EmailVerificationToken {
  id: string;
  userId: string;
  tokenHash: string;
  /** Set only for email-change confirmation tokens; null for plain registration-verification tokens. */
  newEmail: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}
