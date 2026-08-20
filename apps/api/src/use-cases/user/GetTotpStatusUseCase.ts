import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IGetTotpStatusUseCase } from '#src/use-cases/user/IGetTotpStatusUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class GetTotpStatusUseCase implements IGetTotpStatusUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<boolean> {
    const user = await this.deps.userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    return user.totpEnabled;
  }
}
