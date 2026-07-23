import { createHash } from 'crypto';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IEmailVerificationTokenRepository } from '@/use-cases/ports/IEmailVerificationTokenRepository.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IVerifyEmailUseCase,
  VerifyEmailInput,
} from '@/use-cases/auth/IVerifyEmailUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  emailVerificationTokenRepository: IEmailVerificationTokenRepository;
}

export class VerifyEmailUseCase implements IVerifyEmailUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: VerifyEmailInput): Promise<void> {
    const tokenHash = createHash('sha256').update(input.token).digest('hex');
    const verificationToken =
      await this.deps.emailVerificationTokenRepository.findByTokenHash(tokenHash);

    if (
      !verificationToken ||
      verificationToken.usedAt ||
      verificationToken.expiresAt < new Date()
    ) {
      throw Object.assign(new Error('Invalid or expired verification link'), {
        code: ERROR_CODES.UNAUTHORIZED,
      });
    }

    await this.deps.userRepository.update(verificationToken.userId, {
      emailVerifiedAt: new Date(),
    });
    await this.deps.emailVerificationTokenRepository.markUsed(verificationToken.id);
  }
}
