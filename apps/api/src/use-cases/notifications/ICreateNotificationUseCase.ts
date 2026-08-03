import type { Notification, NotificationType } from '#src/domain/notification/Notification.js';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  url?: string | null;
}

export type CreateNotificationOutput = Notification;

export interface ICreateNotificationUseCase {
  execute(input: CreateNotificationInput): Promise<CreateNotificationOutput>;
}
