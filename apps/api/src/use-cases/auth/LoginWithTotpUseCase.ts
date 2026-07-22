import bcrypt from 'bcryptjs';
import type { User } from '@/domain/user/User.js';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import { createTotp } from '@/infrastructure/auth/totp.js';
import { ERROR_CODES, TOTP_CONFIG } from '@/constants.js';
import type {
  ILoginWithTotpUseCase,
  LoginWithTotpInput,
} from '@/use-cases/auth/ILoginWithTotpUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class LoginWithTotpUseCase implements ILoginWithTotpUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: LoginWithTotpInput): Promise<User> {
    const user = await this.deps.userRepository.findByEmail(input.email);
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { code: ERROR_CODES.UNAUTHORIZED });
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
      throw Object.assign(new Error('Invalid credentials'), { code: ERROR_CODES.UNAUTHORIZED });
    }

    if (!user.totpEnabled || !user.totpSecret) {
      throw Object.assign(new Error('Invalid credentials'), { code: ERROR_CODES.UNAUTHORIZED });
    }

    const result = await createTotp({ secret: user.totpSecret }).verify(input.code, {
      epochTolerance: TOTP_CONFIG.EPOCH_TOLERANCE_S,
    });
    if (!result.valid) {
      throw Object.assign(new Error('Invalid verification code'), {
        code: ERROR_CODES.UNAUTHORIZED,
      });
    }

    return user;
  }
}
