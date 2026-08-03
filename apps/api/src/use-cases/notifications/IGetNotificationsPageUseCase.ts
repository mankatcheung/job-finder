import type { Notification } from '#src/domain/notification/Notification.js';

export interface GetNotificationsPageInput {
  userId: string;
  cursor?: string;
  limit?: number;
}

export interface GetNotificationsPageOutput {
  items: Notification[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface IGetNotificationsPageUseCase {
  execute(input: GetNotificationsPageInput): Promise<GetNotificationsPageOutput>;
}
