import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IUpdatePasswordUseCase, UpdatePasswordInput } from '@/use-cases/user/IUpdatePasswordUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class UpdatePasswordUseCase implements IUpdatePasswordUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdatePasswordInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) throw Object.assign(new Error('Invalid password'), { code: 'UNAUTHORIZED' });

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await this.deps.userRepository.update(input.userId, { passwordHash });
  }
}
