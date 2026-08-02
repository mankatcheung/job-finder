import bcrypt from 'bcryptjs';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import { ERROR_CODES } from '#src/constants.js';
import { assertHasPassword } from '#src/use-cases/auth/passwordHashGuard.js';
import { isSessionFresh } from '#src/use-cases/auth/sessionFreshness.js';
import type {
  IDeleteAccountUseCase,
  DeleteAccountInput,
} from '#src/use-cases/user/IDeleteAccountUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class DeleteAccountUseCase implements IDeleteAccountUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteAccountInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });
    assertHasPassword(user.passwordHash);

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid)
      throw Object.assign(new Error('Invalid password'), { code: ERROR_CODES.UNAUTHORIZED });

    if (user.totpEnabled && !isSessionFresh(input.authTime)) {
      throw Object.assign(new Error('Please verify your identity again to continue.'), {
        code: ERROR_CODES.STEP_UP_REQUIRED,
      });
    }

    await this.deps.userRepository.delete(input.userId);
  }
}
