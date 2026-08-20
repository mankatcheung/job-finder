import { NotFoundError, ValidationError } from '#src/use-cases/errors/DomainError.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
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
    if (!user) throw new NotFoundError('User not found');

    if (
      input.weeklyApplicationGoal !== undefined &&
      (!Number.isInteger(input.weeklyApplicationGoal) ||
        input.weeklyApplicationGoal < 1 ||
        input.weeklyApplicationGoal > 100)
    ) {
      throw new ValidationError('Weekly application goal must be between 1 and 100');
    }

    const frequency = input.digestFrequency;
    if (frequency && !Object.values(DIGEST_FREQUENCY).includes(frequency)) {
      throw new ValidationError('Invalid digest frequency');
    }

    const updateData: Parameters<IUserRepository['update']>[1] = {
      weeklyDigestEnabled:
        frequency === 'off' ? false : frequency ? true : input.weeklyDigestEnabled,
      followUpRemindersEnabled: input.followUpRemindersEnabled,
      pushNotificationsEnabled: input.pushNotificationsEnabled,
    };
    if (frequency) updateData.digestFrequency = frequency;
    if (input.weeklyApplicationGoal !== undefined) {
      updateData.weeklyApplicationGoal = input.weeklyApplicationGoal;
    }
    await this.deps.userRepository.update(input.userId, updateData);
  }
}
