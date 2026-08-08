import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import { ERROR_CODES } from '#src/constants.js';
import { DIGEST_FREQUENCY } from '#src/constants.js';
import type {
  IUpdateNotificationPreferencesUseCase,
  UpdateNotificationPreferencesInput,
} from '#src/use-cases/user/IUpdateNotificationPreferencesUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class UpdateNotificationPreferencesUseCase implements IUpdateNotificationPreferencesUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateNotificationPreferencesInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    const frequency = input.digestFrequency;
    if (frequency && !Object.values(DIGEST_FREQUENCY).includes(frequency)) {
      throw Object.assign(new Error('Invalid digest frequency'), { code: ERROR_CODES.VALIDATION });
    }

    const updateData: Parameters<IUserRepository['update']>[1] = {
      weeklyDigestEnabled:
        frequency === 'off' ? false : frequency ? true : input.weeklyDigestEnabled,
      followUpRemindersEnabled: input.followUpRemindersEnabled,
      pushNotificationsEnabled: input.pushNotificationsEnabled,
    };
    if (frequency) updateData.digestFrequency = frequency;

    await this.deps.userRepository.update(input.userId, updateData);
  }
}
