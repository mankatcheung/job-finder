import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import { ERROR_CODES } from '#src/constants.js';
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

    if (
      input.weeklyApplicationGoal !== undefined &&
      (!Number.isInteger(input.weeklyApplicationGoal) ||
        input.weeklyApplicationGoal < 1 ||
        input.weeklyApplicationGoal > 100)
    ) {
      throw Object.assign(new Error('Weekly application goal must be between 1 and 100'), {
        code: ERROR_CODES.VALIDATION,
      });
    }

    const updateData: Parameters<IUserRepository['update']>[1] = {
      weeklyDigestEnabled: input.weeklyDigestEnabled,
      followUpRemindersEnabled: input.followUpRemindersEnabled,
      pushNotificationsEnabled: input.pushNotificationsEnabled,
    };
    if (input.weeklyApplicationGoal !== undefined) {
      updateData.weeklyApplicationGoal = input.weeklyApplicationGoal;
    }
    await this.deps.userRepository.update(input.userId, updateData);
  }
}
