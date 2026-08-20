import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type {
  IGetNotificationPreferencesUseCase,
  NotificationPreferences,
} from '#src/use-cases/user/IGetNotificationPreferencesUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class GetNotificationPreferencesUseCase implements IGetNotificationPreferencesUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<NotificationPreferences> {
    const user = await this.deps.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    return {
      weeklyDigestEnabled: user.weeklyDigestEnabled,
      digestFrequency: user.digestFrequency,
      followUpRemindersEnabled: user.followUpRemindersEnabled,
      pushNotificationsEnabled: user.pushNotificationsEnabled,
      weeklyApplicationGoal: user.weeklyApplicationGoal,
    };
  }
}
