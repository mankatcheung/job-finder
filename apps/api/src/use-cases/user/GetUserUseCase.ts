import type { User } from '@/domain/user/User.js';
import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IGetUserUseCase } from '@/use-cases/user/IGetUserUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class GetUserUseCase implements IGetUserUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<User | null> {
    return this.deps.userRepository.findById(userId);
  }
}
