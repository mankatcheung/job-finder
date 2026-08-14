import bcrypt from 'bcryptjs';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IBackupEmailVerificationTokenRepository } from '#src/use-cases/ports/IBackupEmailVerificationTokenRepository.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import { ERROR_CODES } from '#src/constants.js';
import { assertHasPassword } from '#src/use-cases/auth/passwordHashGuard.js';
import { isSessionFresh } from '#src/use-cases/auth/sessionFreshness.js';
import type {
  IRemoveBackupEmailUseCase,
  RemoveBackupEmailInput,
} from '#src/use-cases/user/IRemoveBackupEmailUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  backupEmailVerificationTokenRepository: IBackupEmailVerificationTokenRepository;
  removeBackupEmailRateLimiter: IRateLimiter;
}

export class RemoveBackupEmailUseCase implements IRemoveBackupEmailUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RemoveBackupEmailInput): Promise<void> {
    const allowed = await this.deps.removeBackupEmailRateLimiter.consume(
      `remove-backup-email:user:${input.userId}`,
    );
    if (!allowed) {
      throw Object.assign(new Error('Too many requests. Try again later.'), {
        code: ERROR_CODES.RATE_LIMITED,
      });
    }

    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });
    assertHasPassword(user.passwordHash);

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid)
      throw Object.assign(new Error('Invalid password'), { code: ERROR_CODES.UNAUTHORIZED });

    if (user.totpEnabled && !isSessionFresh(input.authTime)) {
      throw Object.assign(new Error('Please verify your identity again to continue.'), {
        code: ERROR_CODES.STEP_UP_REQUIRED,
      });
    }

    await this.deps.userRepository.update(input.userId, {
      backupEmail: null,
      backupEmailVerifiedAt: null,
    });

    await this.deps.backupEmailVerificationTokenRepository.deleteAllForUser(input.userId);
  }
}
