import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IBackupEmailVerificationTokenRepository } from '#src/use-cases/ports/IBackupEmailVerificationTokenRepository.js';
import type { IEmailService } from '#src/use-cases/ports/IEmailService.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import { ERROR_CODES, BACKUP_EMAIL_VERIFICATION_TOKEN } from '#src/constants.js';
import { assertHasPassword } from '#src/use-cases/auth/passwordHashGuard.js';
import { isSessionFresh } from '#src/use-cases/auth/sessionFreshness.js';
import type {
  IRequestAddBackupEmailUseCase,
  RequestAddBackupEmailInput,
} from '#src/use-cases/user/IRequestAddBackupEmailUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  backupEmailVerificationTokenRepository: IBackupEmailVerificationTokenRepository;
  emailService: IEmailService;
  requestAddBackupEmailRateLimiter: IRateLimiter;
  generateId: () => string;
  webAppOrigin: string;
}

export class RequestAddBackupEmailUseCase implements IRequestAddBackupEmailUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RequestAddBackupEmailInput): Promise<void> {
    const allowedByUser = await this.deps.requestAddBackupEmailRateLimiter.consume(
      `request-add-backup-email:user:${input.userId}`,
    );
    if (!allowedByUser) {
      throw Object.assign(new Error('Too many backup email requests. Try again later.'), {
        code: ERROR_CODES.RATE_LIMITED,
      });
    }

    const allowedByEmail = await this.deps.requestAddBackupEmailRateLimiter.consume(
      `request-add-backup-email:email:${input.backupEmail}`,
    );
    if (!allowedByEmail) {
      throw Object.assign(new Error('Too many backup email requests. Try again later.'), {
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

    if (input.backupEmail === user.email) {
      throw Object.assign(new Error('Backup email must be different from your current email'), {
        code: ERROR_CODES.VALIDATION,
      });
    }

    // Check if backup email is already used by another user. Silently continue
    // either way to prevent email enumeration.
    const existingUser = await this.deps.userRepository.findByBackupEmail(input.backupEmail);
    if (existingUser && existingUser.id !== user.id) {
      // Email already in use — treat as success to prevent enumeration.
      return;
    }

    // Clear any previous unconfirmed backup email tokens for this user.
    await this.deps.backupEmailVerificationTokenRepository.deleteAllForUser(user.id);

    const rawToken = randomBytes(BACKUP_EMAIL_VERIFICATION_TOKEN.RANDOM_BYTES).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + BACKUP_EMAIL_VERIFICATION_TOKEN.TTL_MS);

    await this.deps.backupEmailVerificationTokenRepository.create({
      id: this.deps.generateId(),
      userId: user.id,
      tokenHash,
      newBackupEmail: input.backupEmail,
      expiresAt,
    });

    const verifyUrl = `${this.deps.webAppOrigin}/confirm-backup-email?token=${rawToken}`;
    await this.deps.emailService.sendBackupEmailVerification(input.backupEmail, verifyUrl);
  }
}
