export interface WeeklyDigestData {
  totalApplications: number;
  byStatus: Record<string, number>;
  newThisWeek: Array<{ company: string; role: string }>;
  overdueFollowUps: Array<{ company: string; role: string; followUpAt: Date }>;
  upcomingFollowUps: Array<{ company: string; role: string; followUpAt: Date }>;
}

export interface IEmailService {
  sendFollowUpReminder(to: string, company: string, role: string, followUpAt: Date): Promise<void>;
  sendWeeklyDigest(to: string, data: WeeklyDigestData): Promise<void>;
  sendPasswordReset(to: string, resetUrl: string): Promise<void>;
}
