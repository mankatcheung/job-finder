export interface WeeklyDigestData {
  totalApplications: number;
  byStatus: Record<string, number>;
  newThisWeek: Array<{ company: string; role: string }>;
  overdueFollowUps: Array<{ company: string; role: string; followUpAt: Date }>;
  upcomingFollowUps: Array<{ company: string; role: string; followUpAt: Date }>;
  weeklyApplicationGoal?: number;
  currentWeekApplicationCount?: number;
  applicationStreakWeeks?: number;
}

export interface IEmailService {
  sendFollowUpReminder(to: string, company: string, role: string, followUpAt: Date): Promise<void>;
  sendWeeklyDigest(
    to: string,
    data: WeeklyDigestData,
    frequency?: 'daily' | 'weekly',
  ): Promise<void>;
  sendPasswordReset(to: string, resetUrl: string): Promise<void>;
  sendEmailVerification(to: string, verifyUrl: string): Promise<void>;
  sendBackupEmailVerification(to: string, verifyUrl: string): Promise<void>;
  sendNewDeviceLoginAlert(
    to: string,
    deviceLabel: string,
    location: string | null,
    ipAddress: string | null,
    loginTime: Date,
  ): Promise<void>;
}
