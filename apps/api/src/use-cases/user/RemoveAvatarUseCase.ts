import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IStorageProvider } from '@/use-cases/ports/IStorageProvider.js';
import { ERROR_CODES } from '@/constants.js';
import type { IRemoveAvatarUseCase } from '@/use-cases/user/IRemoveAvatarUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  storageProvider: IStorageProvider;
}

export class RemoveAvatarUseCase implements IRemoveAvatarUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<void> {
    const user = await this.deps.userRepository.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    if (!user.avatarKey) return; // Already has no avatar — idempotent no-op.

    await this.deps.storageProvider.delete(user.avatarKey);
    await this.deps.userRepository.update(userId, { avatarKey: null });
  }
}
