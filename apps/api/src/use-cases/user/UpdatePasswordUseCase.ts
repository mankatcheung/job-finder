import bcrypt from 'bcryptjs';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IRateLimiter } from '#src/use-cases/ports/IRateLimiter.js';
import type { ISecurityEventRepository } from '#src/use-cases/ports/ISecurityEventRepository.js';
import { ERROR_CODES } from '#src/constants.js';
import { assertValidPassword } from '#src/use-cases/auth/passwordValidation.js';
import { assertHasPassword } from '#src/use-cases/auth/passwordHashGuard.js';
import { isSessionFresh } from '#src/use-cases/auth/sessionFreshness.js';
import type {
  IUpdatePasswordUseCase,
  UpdatePasswordInput,
} from '#src/use-cases/user/IUpdatePasswordUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  updatePasswordRateLimiter: IRateLimiter;
  securityEventRepository: ISecurityEventRepository;
  generateId: () => string;
}

export class UpdatePasswordUseCase implements IUpdatePasswordUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdatePasswordInput): Promise<void> {
    assertValidPassword(input.newPassword);

    // Rate-limit by user ID to prevent brute-force attacks on password changes
    const allowed = await this.deps.updatePasswordRateLimiter.consume(
      `update-password:user:${input.userId}`,
    );
    if (!allowed) {
      throw Object.assign(new Error('Too many password update requests. Try again later.'), {
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

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await this.deps.userRepository.update(input.userId, { passwordHash });

    await this.deps.securityEventRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      eventType: 'password_changed',
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
  }
}
