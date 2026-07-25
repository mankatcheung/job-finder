import { createHash } from 'crypto';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IEmailVerificationTokenRepository } from '@/use-cases/ports/IEmailVerificationTokenRepository.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IConfirmEmailChangeUseCase,
  ConfirmEmailChangeInput,
} from '@/use-cases/user/IConfirmEmailChangeUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  emailVerificationTokenRepository: IEmailVerificationTokenRepository;
}

export class ConfirmEmailChangeUseCase implements IConfirmEmailChangeUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: ConfirmEmailChangeInput): Promise<void> {
    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const verificationToken =
      await this.deps.emailVerificationTokenRepository.findByTokenHash(tokenHash);

    if (
      !verificationToken ||
      !verificationToken.newEmail ||
      verificationToken.usedAt ||
      verificationToken.expiresAt < new Date()
    ) {
      throw Object.assign(new Error('Invalid or expired confirmation link'), {
        code: ERROR_CODES.UNAUTHORIZED,
      });
    }

    // Guard against a race: someone else may have taken the new address
    // while this confirmation link was sitting unused.
    const existing = await this.deps.userRepository.findByEmail(verificationToken.newEmail);
    if (existing && existing.id !== verificationToken.userId) {
      throw Object.assign(new Error('Email already in use'), { code: ERROR_CODES.CONFLICT });
    }

    await this.deps.userRepository.update(verificationToken.userId, {
      email: verificationToken.newEmail,
      emailVerifiedAt: new Date(),
    });
    await this.deps.emailVerificationTokenRepository.markUsed(verificationToken.id);
  }
}
