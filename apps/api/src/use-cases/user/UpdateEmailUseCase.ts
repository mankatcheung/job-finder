import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { ISendEmailVerificationUseCase } from '@/use-cases/auth/ISendEmailVerificationUseCase.js';
import { ERROR_CODES } from '@/constants.js';
import { assertHasPassword } from '@/use-cases/auth/passwordHashGuard.js';
import type {
  IUpdateEmailUseCase,
  UpdateEmailInput,
} from '@/use-cases/user/IUpdateEmailUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  sendEmailVerificationUseCase: ISendEmailVerificationUseCase;
}

export class UpdateEmailUseCase implements IUpdateEmailUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: UpdateEmailInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });
    assertHasPassword(user.passwordHash);

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid)
      throw Object.assign(new Error('Invalid password'), { code: ERROR_CODES.UNAUTHORIZED });

    const existing = await this.deps.userRepository.findByEmail(input.newEmail);
    if (existing && existing.id !== input.userId) {
      throw Object.assign(new Error('Email already in use'), { code: ERROR_CODES.CONFLICT });
    }

    // Changing the email address invalidates verification of the old one —
    // the new address must be re-confirmed before it counts as verified.
    await this.deps.userRepository.update(input.userId, {
      email: input.newEmail,
      emailVerifiedAt: null,
    });

    try {
      await this.deps.sendEmailVerificationUseCase.execute(input.userId);
    } catch {
      // Verification email delivery is non-critical — don't block the email
      // change if the email provider is down or unconfigured (e.g. local dev).
    }
  }
}
