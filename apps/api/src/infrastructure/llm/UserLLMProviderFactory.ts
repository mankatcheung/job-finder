import { PROVIDER_REGISTRY } from '#src/infrastructure/llm/providerRegistry.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { ILlmApiKeyCipher } from '#src/use-cases/ports/ILlmApiKeyCipher.js';
import type { ILLMProvider } from '#src/use-cases/ports/ILLMProvider.js';
import type { ILLMProviderFactory } from '#src/use-cases/ports/ILLMProviderFactory.js';

interface Deps {
  userRepository: IUserRepository;
  llmApiKeyCipher: ILlmApiKeyCipher;
}

export class UserLLMProviderFactory implements ILLMProviderFactory {
  constructor(private readonly deps: Deps) {}

  async forUser(userId: string): Promise<ILLMProvider | null> {
    const user = await this.deps.userRepository.findById(userId);
    if (!user?.llmProvider || !user.llmApiKey) return null;

    const entry = PROVIDER_REGISTRY[user.llmProvider];
    if (!entry) return null;

    const apiKey = this.deps.llmApiKeyCipher.decrypt(user.llmApiKey);
    return entry.create({ apiKey, model: user.llmModel, baseUrl: user.llmBaseUrl });
  }
}
