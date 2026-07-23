import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { ISendEmailVerificationUseCase } from '@/use-cases/auth/ISendEmailVerificationUseCase.js';
import { ERROR_CODES } from '@/constants.js';
import type {
  IRegisterUseCase,
  RegisterInput,
  RegisterOutput,
} from '@/use-cases/auth/IRegisterUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  generateId: () => string;
  sendEmailVerificationUseCase: ISendEmailVerificationUseCase;
}

export class RegisterUseCase implements IRegisterUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const existing = await this.deps.userRepository.findByEmail(input.email);
    if (existing) {
      throw Object.assign(new Error('Email already registered'), { code: ERROR_CODES.CONFLICT });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.deps.userRepository.create({
      id: this.deps.generateId(),
      email: input.email,
      passwordHash,
    });

    try {
      await this.deps.sendEmailVerificationUseCase.execute(user.id);
    } catch {
      // Verification email delivery is non-critical — don't block account
      // creation if the email provider is down or unconfigured (e.g. local dev).
    }

    return { userId: user.id, email: user.email };
  }
}
