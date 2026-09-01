import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import { createHash, randomBytes } from 'crypto';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IEmailVerificationTokenRepository } from '#src/use-cases/ports/IEmailVerificationTokenRepository.js';
import type { IEmailService } from '#src/use-cases/ports/IEmailService.js';
import { EMAIL_VERIFICATION_TOKEN } from '#src/use-cases/constants.js';
import type { ISendEmailVerificationUseCase } from '#src/use-cases/auth/ISendEmailVerificationUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  emailVerificationTokenRepository: IEmailVerificationTokenRepository;
  emailService: IEmailService;
  generateId: () => string;
  webAppOrigin: string;
}

export class SendEmailVerificationUseCase implements ISendEmailVerificationUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<void> {
    const user = await this.deps.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    await this.deps.emailVerificationTokenRepository.deleteAllForUser(user.id);

    const rawToken = randomBytes(EMAIL_VERIFICATION_TOKEN.RANDOM_BYTES).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN.TTL_MS);

    await this.deps.emailVerificationTokenRepository.create({
      id: this.deps.generateId(),
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const verifyUrl = `${this.deps.webAppOrigin}/verify-email?token=${rawToken}`;
    await this.deps.emailService.sendEmailVerification(user.email, verifyUrl);
  }
}
