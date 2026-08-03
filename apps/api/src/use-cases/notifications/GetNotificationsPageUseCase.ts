import type { INotificationRepository } from '#src/use-cases/ports/INotificationRepository.js';
import { PAGINATION } from '#src/constants.js';
import type {
  IGetNotificationsPageUseCase,
  GetNotificationsPageInput,
  GetNotificationsPageOutput,
} from '#src/use-cases/notifications/IGetNotificationsPageUseCase.js';

interface Deps {
  notificationRepository: INotificationRepository;
}

export class GetNotificationsPageUseCase implements IGetNotificationsPageUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetNotificationsPageInput): Promise<GetNotificationsPageOutput> {
    const limit = Math.max(
      1,
      Math.min(input.limit ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT),
    );

    const { items, hasNextPage } = await this.deps.notificationRepository.findPageByUserId(
      input.userId,
      { cursor: input.cursor, limit },
    );

    return {
      items,
      hasNextPage,
      nextCursor: hasNextPage ? items[items.length - 1].id : null,
    };
  }
}
