import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IUpdateNotificationPreferencesUseCase,
  UpdateNotificationPreferencesInput,
} from '@/use-cases/user/IUpdateNotificationPreferencesUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class UpdateNotificationPreferencesUseCase implements IUpdateNotificationPreferencesUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateNotificationPreferencesInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    await this.deps.userRepository.update(input.userId, {
      weeklyDigestEnabled: input.weeklyDigestEnabled,
      followUpRemindersEnabled: input.followUpRemindersEnabled,
    });
  }
}
