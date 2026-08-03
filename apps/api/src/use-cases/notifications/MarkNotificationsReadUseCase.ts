import type { INotificationRepository } from '#src/use-cases/ports/INotificationRepository.js';
import { assertValidBulkNotificationIds } from '#src/use-cases/notifications/bulkValidation.js';
import type {
  IMarkNotificationsReadUseCase,
  MarkNotificationsReadInput,
} from '#src/use-cases/notifications/IMarkNotificationsReadUseCase.js';

interface Deps {
  notificationRepository: INotificationRepository;
}

export class MarkNotificationsReadUseCase implements IMarkNotificationsReadUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: MarkNotificationsReadInput): Promise<void> {
    assertValidBulkNotificationIds(input.ids);
    await this.deps.notificationRepository.markManyReadForUser(
      input.userId,
      input.ids,
      input.isRead,
    );
  }
}
