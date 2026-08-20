import { UnauthorizedError } from '#src/use-cases/errors/DomainError.js';
import { createHash } from 'crypto';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IEmailVerificationTokenRepository } from '#src/use-cases/ports/IEmailVerificationTokenRepository.js';
import type {
  IVerifyEmailUseCase,
  VerifyEmailInput,
} from '#src/use-cases/auth/IVerifyEmailUseCase.js';

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
      throw new UnauthorizedError('Invalid or expired verification link');
    }

    await this.deps.userRepository.update(verificationToken.userId, {
      emailVerifiedAt: new Date(),
    });
    await this.deps.emailVerificationTokenRepository.markUsed(verificationToken.id);
  }
}
