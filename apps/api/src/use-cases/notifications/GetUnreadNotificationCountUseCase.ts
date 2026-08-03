import type { INotificationRepository } from '#src/use-cases/ports/INotificationRepository.js';
import type { IGetUnreadNotificationCountUseCase } from '#src/use-cases/notifications/IGetUnreadNotificationCountUseCase.js';

interface Deps {
  notificationRepository: INotificationRepository;
}

export class GetUnreadNotificationCountUseCase implements IGetUnreadNotificationCountUseCase {
  constructor(private readonly deps: Deps) {}

  execute(userId: string): Promise<number> {
    return this.deps.notificationRepository.countUnreadForUser(userId);
  }
}
