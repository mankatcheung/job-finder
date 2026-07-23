import { createHash, randomBytes } from 'crypto';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IEmailVerificationTokenRepository } from '@/use-cases/ports/IEmailVerificationTokenRepository.js';
import type { IEmailService } from '@/use-cases/ports/IEmailService.js';
import { ERROR_CODES, EMAIL_VERIFICATION_TOKEN } from '@/constants.js';
import type { ISendEmailVerificationUseCase } from '@/use-cases/auth/ISendEmailVerificationUseCase.js';

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
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

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
