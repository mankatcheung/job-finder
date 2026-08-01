import type { ILlmApiKeyRepository } from '#src/use-cases/ports/ILlmApiKeyRepository.js';
import type { LlmApiKey } from '#src/domain/llmApiKey/LlmApiKey.js';
import type { IListLlmApiKeysUseCase } from '#src/use-cases/user/IListLlmApiKeysUseCase.js';

interface Deps {
  llmApiKeyRepository: ILlmApiKeyRepository;
}

export class ListLlmApiKeysUseCase implements IListLlmApiKeysUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<LlmApiKey[]> {
    return this.deps.llmApiKeyRepository.findAllByUserId(userId);
  }
}
