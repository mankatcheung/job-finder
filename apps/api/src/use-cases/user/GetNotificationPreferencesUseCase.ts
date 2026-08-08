import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import { ERROR_CODES } from '#src/constants.js';
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
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    return {
      weeklyDigestEnabled: user.weeklyDigestEnabled,
      digestFrequency: user.digestFrequency,
      followUpRemindersEnabled: user.followUpRemindersEnabled,
      pushNotificationsEnabled: user.pushNotificationsEnabled,
      weeklyApplicationGoal: user.weeklyApplicationGoal,
    };
  }
}
