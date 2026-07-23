import { createHash, randomBytes } from 'crypto';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IPasswordResetTokenRepository } from '@/use-cases/ports/IPasswordResetTokenRepository.js';
import type { IEmailService } from '@/use-cases/ports/IEmailService.js';
import type { IRateLimiter } from '@/use-cases/ports/IRateLimiter.js';
import { ERROR_CODES, PASSWORD_RESET_TOKEN } from '@/constants.js';
import type {
  IRequestPasswordResetUseCase,
  RequestPasswordResetInput,
} from '@/use-cases/auth/IRequestPasswordResetUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  passwordResetTokenRepository: IPasswordResetTokenRepository;
  emailService: IEmailService;
  passwordResetRateLimiter: IRateLimiter;
  generateId: () => string;
  webAppOrigin: string;
}

export class RequestPasswordResetUseCase implements IRequestPasswordResetUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    // Rate-limit by both email and IP *before* looking the account up, and by
    // the exact same amount of work regardless of outcome, so a rate-limit
    // response never reveals whether the account exists.
    const emailAllowed = this.deps.passwordResetRateLimiter.consume(
      `password-reset:email:${input.email.toLowerCase()}`,
    );
    const ipAllowed = input.ipAddress
      ? this.deps.passwordResetRateLimiter.consume(`password-reset:ip:${input.ipAddress}`)
      : true;
    if (!emailAllowed || !ipAllowed) {
      throw Object.assign(new Error('Too many password reset requests. Try again later.'), {
        code: ERROR_CODES.RATE_LIMITED,
      });
    }

    const user = await this.deps.userRepository.findByEmail(input.email);
    // Silently no-op for unknown emails so this endpoint can't be used to enumerate accounts.
    if (!user) return;

    await this.deps.passwordResetTokenRepository.deleteAllForUser(user.id);

    const rawToken = randomBytes(PASSWORD_RESET_TOKEN.RANDOM_BYTES).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN.TTL_MS);

    await this.deps.passwordResetTokenRepository.create({
      id: this.deps.generateId(),
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${this.deps.webAppOrigin}/reset-password?token=${rawToken}`;
    try {
      await this.deps.emailService.sendPasswordReset(user.email, resetUrl);
    } catch {
      // An email-provider failure must not surface differently than the
      // silent no-op above for unknown emails — otherwise it becomes an
      // enumeration oracle (errors only ever occur for real accounts).
    }
  }
}
