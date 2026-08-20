import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IStorageProvider } from '#src/use-cases/ports/IStorageProvider.js';
import type { IRemoveAvatarUseCase } from '#src/use-cases/user/IRemoveAvatarUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  storageProvider: IStorageProvider;
}

export class RemoveAvatarUseCase implements IRemoveAvatarUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<void> {
    const user = await this.deps.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (!user.avatarKey) return; // Already has no avatar — idempotent no-op.

    await this.deps.storageProvider.delete(user.avatarKey);
    await this.deps.userRepository.update(userId, { avatarKey: null });
  }
}
