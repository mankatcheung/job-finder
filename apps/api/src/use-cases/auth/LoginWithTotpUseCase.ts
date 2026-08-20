import { RateLimitedError, UnauthorizedError } from '#src/use-cases/errors/DomainError.js';
import bcrypt from 'bcryptjs';
import type { User } from '#src/domain/user/User.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { ITotpBackupCodeRepository } from '#src/use-cases/ports/ITotpBackupCodeRepository.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import type { ITotpProvider } from '#src/use-cases/ports/ITotpProvider.js';
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
      throw new UnauthorizedError('Invalid credentials');
    }

    assertHasPassword(user.passwordHash);
    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.totpEnabled || !user.totpSecret) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const allowedByEmail = await this.deps.totpRateLimiter.consume(
      `totp:email:${input.email.toLowerCase()}`,
    );
    const allowedByIp = input.ipAddress
      ? await this.deps.totpRateLimiter.consume(`totp:ip:${input.ipAddress}`)
      : true;
    if (!allowedByEmail || !allowedByIp) {
      throw new RateLimitedError('Too many verification attempts. Please try again later.');
    }

    const validCode = await verifyTotpOrBackupCode(
      this.deps,
      { id: user.id, totpSecret: user.totpSecret },
      input.code,
    );
    if (!validCode) {
      throw new UnauthorizedError('Invalid verification code');
    }

    return user;
  }
}
