import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import {
  assertAllowedAvatarMimeType,
  assertValidAvatarSizeBytes,
} from '#src/use-cases/user/avatarValidation.js';
import type {
  IConfirmAvatarUseCase,
  ConfirmAvatarInput,
} from '#src/use-cases/user/IConfirmAvatarUseCase.js';

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
    if (!user) throw new NotFoundError('User not found');

    const previousKey = user.avatarKey;
    await this.deps.userRepository.update(input.userId, { avatarKey: input.storageKey });

    // Clean up the old photo now that the new one is live — avoids
    // accumulating orphaned files every time a user changes their avatar.
    if (previousKey && previousKey !== input.storageKey) {
      await this.deps.storageProvider.delete(previousKey);
    }
  }
}
