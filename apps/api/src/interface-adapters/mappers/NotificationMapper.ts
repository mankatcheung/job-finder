import type { Notification, NotificationType } from '#src/domain/notification/Notification.js';

export interface NotificationDTO {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationConnectionDTO {
  items: NotificationDTO[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export class NotificationMapper {
  toDTO(notification: Notification): NotificationDTO {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      url: notification.url,
      read: notification.readAt !== null,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
