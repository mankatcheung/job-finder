import type { Notification, NotificationType } from '#src/domain/notification/Notification.js';

export interface CreateNotificationData {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  url?: string | null;
}

export interface FindNotificationsPagePagination {
  cursor?: string;
  limit: number;
}

export interface NotificationsPage {
  items: Notification[];
  hasNextPage: boolean;
}

export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<Notification>;
  findPageByUserId(
    userId: string,
    pagination: FindNotificationsPagePagination,
  ): Promise<NotificationsPage>;
  /** Marks the given notifications (scoped to userId, ignoring ids that don't belong to them) read/unread. Returns the number of rows actually updated. */
  markManyReadForUser(userId: string, ids: string[], isRead: boolean): Promise<number>;
  countUnreadForUser(userId: string): Promise<number>;
}
