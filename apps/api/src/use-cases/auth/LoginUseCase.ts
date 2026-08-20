import { UnauthorizedError, UserNotFoundError } from '#src/use-cases/errors/DomainError.js';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { ILoginEventRepository } from '#src/use-cases/ports/ILoginEventRepository.js';
import type { ILoginUseCase, LoginInput, LoginOutput } from '#src/use-cases/auth/ILoginUseCase.js';
import { assertHasPassword } from '#src/use-cases/auth/passwordHashGuard.js';

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
      throw new UserNotFoundError('No account found with this email. Please register first.');
    }
    assertHasPassword(user.passwordHash);

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
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
