import type { IGetNotificationsPageUseCase } from '#src/use-cases/notifications/IGetNotificationsPageUseCase.js';
import type { IMarkNotificationsReadUseCase } from '#src/use-cases/notifications/IMarkNotificationsReadUseCase.js';
import type { IGetUnreadNotificationCountUseCase } from '#src/use-cases/notifications/IGetUnreadNotificationCountUseCase.js';
import type {
  NotificationMapper,
  NotificationConnectionDTO,
} from '#src/interface-adapters/mappers/NotificationMapper.js';

interface Deps {
  getNotificationsPageUseCase: IGetNotificationsPageUseCase;
  markNotificationsReadUseCase: IMarkNotificationsReadUseCase;
  getUnreadNotificationCountUseCase: IGetUnreadNotificationCountUseCase;
  notificationMapper: NotificationMapper;
}

interface GetNotificationsPageInput {
  cursor?: string;
  limit?: number;
}

export class NotificationResolver {
  constructor(private readonly deps: Deps) {}

  async getNotificationsPage(
    userId: string,
    input: GetNotificationsPageInput,
  ): Promise<NotificationConnectionDTO> {
    const result = await this.deps.getNotificationsPageUseCase.execute({ userId, ...input });
    return {
      items: result.items.map((n) => this.deps.notificationMapper.toDTO(n)),
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage,
    };
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return this.deps.getUnreadNotificationCountUseCase.execute(userId);
  }

  async markNotificationsRead(userId: string, ids: string[], isRead: boolean): Promise<boolean> {
    await this.deps.markNotificationsReadUseCase.execute({ userId, ids, isRead });
    return true;
  }
}
