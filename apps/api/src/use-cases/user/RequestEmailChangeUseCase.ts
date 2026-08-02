import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IEmailVerificationTokenRepository } from '#src/use-cases/ports/IEmailVerificationTokenRepository.js';
import type { IEmailService } from '#src/use-cases/ports/IEmailService.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import { ERROR_CODES, EMAIL_VERIFICATION_TOKEN } from '#src/constants.js';
import { assertHasPassword } from '#src/use-cases/auth/passwordHashGuard.js';
import { isSessionFresh } from '#src/use-cases/auth/sessionFreshness.js';
import type {
  IRequestEmailChangeUseCase,
  RequestEmailChangeInput,
} from '#src/use-cases/user/IRequestEmailChangeUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  emailVerificationTokenRepository: IEmailVerificationTokenRepository;
  emailService: IEmailService;
  requestEmailChangeRateLimiter: IRateLimiter;
  generateId: () => string;
  webAppOrigin: string;
}

export class RequestEmailChangeUseCase implements IRequestEmailChangeUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RequestEmailChangeInput): Promise<void> {
    // Rate-limit by user ID to prevent abuse of email change requests
    const allowed = this.deps.requestEmailChangeRateLimiter.consume(
      `request-email-change:user:${input.userId}`,
    );
    if (!allowed) {
      throw Object.assign(new Error('Too many email change requests. Try again later.'), {
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

    const existing = await this.deps.userRepository.findByEmail(input.newEmail);
    if (existing && existing.id !== input.userId) {
      throw Object.assign(new Error('Email already in use'), { code: ERROR_CODES.CONFLICT });
    }

    // The email itself is not changed here — only a confirmation link is sent
    // to the new address. The change only takes effect once that link is
    // clicked (ConfirmEmailChangeUseCase), so a typo'd address can never lock
    // the user out of their account.
    await this.deps.emailVerificationTokenRepository.deleteAllForUser(user.id);

    const rawToken = randomBytes(EMAIL_VERIFICATION_TOKEN.RANDOM_BYTES).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN.TTL_MS);

    await this.deps.emailVerificationTokenRepository.create({
      id: this.deps.generateId(),
      userId: user.id,
      tokenHash,
      newEmail: input.newEmail,
      expiresAt,
    });

    const confirmUrl = `${this.deps.webAppOrigin}/confirm-email-change?token=${rawToken}`;
    await this.deps.emailService.sendEmailVerification(input.newEmail, confirmUrl);
  }
}
