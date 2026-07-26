import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IPasswordResetTokenRepository } from '#src/use-cases/ports/IPasswordResetTokenRepository.js';
import type { ISessionRepository } from '#src/use-cases/ports/ISessionRepository.js';
import { ERROR_CODES } from '#src/constants.js';
import { assertValidPassword } from '#src/use-cases/auth/passwordValidation.js';
import type {
  IResetPasswordUseCase,
  ResetPasswordInput,
} from '#src/use-cases/auth/IResetPasswordUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  passwordResetTokenRepository: IPasswordResetTokenRepository;
  sessionRepository: ISessionRepository;
}

export class ResetPasswordUseCase implements IResetPasswordUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    assertValidPassword(input.newPassword);

    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const resetToken = await this.deps.passwordResetTokenRepository.findByTokenHash(tokenHash);

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw Object.assign(new Error('Invalid or expired reset link'), {
        code: ERROR_CODES.UNAUTHORIZED,
      });
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await this.deps.userRepository.update(resetToken.userId, { passwordHash });
    await this.deps.passwordResetTokenRepository.markUsed(resetToken.id);
    // Invalidate every existing session so a refresh token stolen before the
    // reset can't survive it — otherwise the whole point of the reset is defeated.
    await this.deps.sessionRepository.revokeAllForUser(resetToken.userId);
  }
}
