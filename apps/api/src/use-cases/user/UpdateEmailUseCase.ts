import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IUpdateEmailUseCase,
  UpdateEmailInput,
} from '@/use-cases/user/IUpdateEmailUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class UpdateEmailUseCase implements IUpdateEmailUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateEmailInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid)
      throw Object.assign(new Error('Invalid password'), { code: ERROR_CODES.UNAUTHORIZED });

    const existing = await this.deps.userRepository.findByEmail(input.newEmail);
    if (existing && existing.id !== input.userId) {
      throw Object.assign(new Error('Email already in use'), { code: ERROR_CODES.CONFLICT });
    }

    await this.deps.userRepository.update(input.userId, { email: input.newEmail });
  }
}
