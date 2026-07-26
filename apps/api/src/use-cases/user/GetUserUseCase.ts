import type { User } from '#src/domain/user/User.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { IGetUserUseCase } from '#src/use-cases/user/IGetUserUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class GetUserUseCase implements IGetUserUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<User | null> {
    return this.deps.userRepository.findById(userId);
  }
}
