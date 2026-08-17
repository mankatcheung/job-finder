import bcrypt from 'bcryptjs';
import type { User } from '#src/domain/user/User.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { ITotpBackupCodeRepository } from '#src/use-cases/ports/ITotpBackupCodeRepository.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import type { ITotpProvider } from '#src/use-cases/ports/ITotpProvider.js';
import { ERROR_CODES } from '#src/constants.js';
import { assertHasPassword } from '#src/use-cases/auth/passwordHashGuard.js';
import { verifyTotpOrBackupCode } from '#src/use-cases/auth/verifyTotpOrBackupCode.js';
import type {
  ILoginWithTotpUseCase,
  LoginWithTotpInput,
} from '#src/use-cases/auth/ILoginWithTotpUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  totpBackupCodeRepository: ITotpBackupCodeRepository;
  totpRateLimiter: IRateLimiter;
  totpProvider: ITotpProvider;
}

export class LoginWithTotpUseCase implements ILoginWithTotpUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: LoginWithTotpInput): Promise<User> {
    const user = await this.deps.userRepository.findByEmail(input.email);
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { code: ERROR_CODES.UNAUTHORIZED });
    }

    assertHasPassword(user.passwordHash);
    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
      throw Object.assign(new Error('Invalid credentials'), { code: ERROR_CODES.UNAUTHORIZED });
    }

    if (!user.totpEnabled || !user.totpSecret) {
      throw Object.assign(new Error('Invalid credentials'), { code: ERROR_CODES.UNAUTHORIZED });
    }

    const allowedByEmail = await this.deps.totpRateLimiter.consume(
      `totp:email:${input.email.toLowerCase()}`,
    );
    const allowedByIp = input.ipAddress
      ? await this.deps.totpRateLimiter.consume(`totp:ip:${input.ipAddress}`)
      : true;
    if (!allowedByEmail || !allowedByIp) {
      throw Object.assign(new Error('Too many verification attempts. Please try again later.'), {
        code: ERROR_CODES.RATE_LIMITED,
      });
    }

    const validCode = await verifyTotpOrBackupCode(
      this.deps,
      { id: user.id, totpSecret: user.totpSecret },
      input.code,
    );
    if (!validCode) {
      throw Object.assign(new Error('Invalid verification code'), {
        code: ERROR_CODES.UNAUTHORIZED,
      });
    }

    return user;
  }
}
