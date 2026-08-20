import { NotFoundError } from '#src/use-cases/errors/DomainError.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { ILlmApiKeyRepository } from '#src/use-cases/ports/ILlmApiKeyRepository.js';
import type {
  IDeleteLlmApiKeyUseCase,
  DeleteLlmApiKeyInput,
} from '#src/use-cases/user/IDeleteLlmApiKeyUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  llmApiKeyRepository: ILlmApiKeyRepository;
}

export class DeleteLlmApiKeyUseCase implements IDeleteLlmApiKeyUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: DeleteLlmApiKeyInput): Promise<void> {
    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw new NotFoundError('User not found');

    await this.deps.llmApiKeyRepository.delete(input.userId, input.provider);

    if (user.defaultLlmProvider === input.provider) {
      await this.deps.userRepository.update(input.userId, { defaultLlmProvider: null });
    }
  }
}
