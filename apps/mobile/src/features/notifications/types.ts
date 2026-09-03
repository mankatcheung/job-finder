export type NotificationType = 'interview_reminder' | 'follow_up_reminder' | 'security_alert';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationsPage {
  hasNextPage: boolean;
  nextCursor: string | null;
  items: NotificationItem[];
}
