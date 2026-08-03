export type NotificationType = 'interview_reminder' | 'follow_up_reminder' | 'security_alert';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Where clicking the notification navigates to; null if not actionable. */
  url: string | null;
  /** Null = unread. Set to the time the user marked it read. */
  readAt: Date | null;
  createdAt: Date;
}
