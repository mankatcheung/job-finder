import { GoogleAILLMProvider } from '#src/infrastructure/llm/GoogleAILLMProvider.js';
import { OpenRouterLLMProvider } from '#src/infrastructure/llm/OpenRouterLLMProvider.js';
import { LLM_PROVIDER } from '#src/constants.js';
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

    const apiKey = this.deps.llmApiKeyCipher.decrypt(user.llmApiKey);
    return user.llmProvider === LLM_PROVIDER.GOOGLEAI
      ? new GoogleAILLMProvider(apiKey)
      : new OpenRouterLLMProvider(apiKey);
  }
}
