import {
  NotFoundError,
  RateLimitedError,
  StepUpRequiredError,
  UnauthorizedError,
} from '#src/use-cases/errors/DomainError.js';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IBackupEmailVerificationTokenRepository } from '#src/use-cases/ports/IBackupEmailVerificationTokenRepository.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
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
      throw new RateLimitedError('Too many requests. Try again later.');
    }

    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw new NotFoundError('User not found');
    assertHasPassword(user.passwordHash);

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid password');

    if (user.totpEnabled && !isSessionFresh(input.authTime)) {
      throw new StepUpRequiredError('Please verify your identity again to continue.');
    }

    await this.deps.userRepository.update(input.userId, {
      backupEmail: null,
      backupEmailVerifiedAt: null,
    });

    await this.deps.backupEmailVerificationTokenRepository.deleteAllForUser(input.userId);
  }
}
