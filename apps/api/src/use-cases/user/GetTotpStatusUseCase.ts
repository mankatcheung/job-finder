import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import { ERROR_CODES } from '@/constants.js';
import type { IGetTotpStatusUseCase } from '@/use-cases/user/IGetTotpStatusUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class GetTotpStatusUseCase implements IGetTotpStatusUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<boolean> {
    const user = await this.deps.userRepository.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    return user.totpEnabled;
  }
}
