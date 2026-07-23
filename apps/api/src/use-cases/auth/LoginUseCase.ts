import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { ILoginEventRepository } from '@/use-cases/ports/ILoginEventRepository.js';
import type { ILoginUseCase, LoginInput, LoginOutput } from '@/use-cases/auth/ILoginUseCase.js';
import { ERROR_CODES } from '@/constants.js';

interface Deps {
  userRepository: IUserRepository;
  loginEventRepository: ILoginEventRepository;
  generateId: () => string;
}

export class LoginUseCase implements ILoginUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.deps.userRepository.findByEmail(input.email);
    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { code: ERROR_CODES.UNAUTHORIZED });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw Object.assign(new Error('Invalid credentials'), { code: ERROR_CODES.UNAUTHORIZED });
    }

    await this.deps.loginEventRepository.create({
      id: this.deps.generateId(),
      userId: user.id,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });

    return user;
  }
}
