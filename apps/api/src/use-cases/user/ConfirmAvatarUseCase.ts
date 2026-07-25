import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IStorageProvider } from '@/use-cases/ports/IStorageProvider.js';
import { ERROR_CODES } from '@/constants.js';
import {
  assertAllowedAvatarMimeType,
  assertValidAvatarSizeBytes,
} from '@/use-cases/user/avatarValidation.js';
import type {
  IConfirmAvatarUseCase,
  ConfirmAvatarInput,
} from '@/use-cases/user/IConfirmAvatarUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  storageProvider: IStorageProvider;
}

export class ConfirmAvatarUseCase implements IConfirmAvatarUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ConfirmAvatarInput): Promise<void> {
    assertAllowedAvatarMimeType(input.mimeType);
    assertValidAvatarSizeBytes(input.sizeBytes);

    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    const previousKey = user.avatarKey;
    await this.deps.userRepository.update(input.userId, { avatarKey: input.storageKey });

    // Clean up the old photo now that the new one is live — avoids
    // accumulating orphaned files every time a user changes their avatar.
    if (previousKey && previousKey !== input.storageKey) {
      await this.deps.storageProvider.delete(previousKey);
    }
  }
}
