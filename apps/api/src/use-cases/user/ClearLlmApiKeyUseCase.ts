import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import { ERROR_CODES } from '#src/constants.js';
import type { IClearLlmApiKeyUseCase } from '#src/use-cases/user/IClearLlmApiKeyUseCase.js';

interface Deps {
  userRepository: IUserRepository;
}

export class ClearLlmApiKeyUseCase implements IClearLlmApiKeyUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<void> {
    const user = await this.deps.userRepository.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

    await this.deps.userRepository.update(userId, { llmProvider: null, llmApiKey: null });
  }
}
