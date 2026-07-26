import bcrypt from 'bcryptjs';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import { ERROR_CODES } from '#src/constants.js';
import { assertValidPassword } from '#src/use-cases/auth/passwordValidation.js';
import { assertHasPassword } from '#src/use-cases/auth/passwordHashGuard.js';
import type {
  IUpdatePasswordUseCase,
  UpdatePasswordInput,
} from '#src/use-cases/user/IUpdatePasswordUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class UpdatePasswordUseCase implements IUpdatePasswordUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdatePasswordInput): Promise<void> {
    assertValidPassword(input.newPassword);

    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });
    assertHasPassword(user.passwordHash);

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid)
      throw Object.assign(new Error('Invalid password'), { code: ERROR_CODES.UNAUTHORIZED });

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await this.deps.userRepository.update(input.userId, { passwordHash });
  }
}
