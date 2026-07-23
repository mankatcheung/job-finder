export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  timezone: string | null;
  targetRole: string | null;
  emailVerifiedAt: Date | null;
  weeklyDigestEnabled: boolean;
  followUpRemindersEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
