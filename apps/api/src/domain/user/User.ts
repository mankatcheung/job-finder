export interface User {
  id: string;
  email: string;
  passwordHash: string;
  weeklyDigestEnabled: boolean;
  followUpRemindersEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
