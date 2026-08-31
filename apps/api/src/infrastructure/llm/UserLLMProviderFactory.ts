import { PROVIDER_REGISTRY } from '#src/infrastructure/llm/providerRegistry.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { ILlmApiKeyRepository } from '#src/use-cases/ports/ILlmApiKeyRepository.js';
import type { ILlmApiKeyCipher } from '#src/use-cases/ports/ILlmApiKeyCipher.js';
import type { ILLMProvider } from '#src/use-cases/ports/ILLMProvider.js';
import type {
  ILLMProviderFactory,
  LLMProviderCredentials,
} from '#src/use-cases/ports/ILLMProviderFactory.js';

interface Deps {
  userRepository: IUserRepository;
  llmApiKeyRepository: ILlmApiKeyRepository;
  llmApiKeyCipher: ILlmApiKeyCipher;
}

export class UserLLMProviderFactory implements ILLMProviderFactory {
  constructor(private readonly deps: Deps) {}

  async forUser(
    userId: string,
    provider?: string,
    model?: string | null,
  ): Promise<ILLMProvider | null> {
    let resolvedProvider = provider;
    if (!resolvedProvider) {
      const user = await this.deps.userRepository.findById(userId);
      resolvedProvider = user?.defaultLlmProvider ?? undefined;
    }
    if (!resolvedProvider) return null;

    const key = await this.deps.llmApiKeyRepository.findByUserIdAndProvider(
      userId,
      resolvedProvider,
    );
    if (!key) return null;

    const entry = PROVIDER_REGISTRY[resolvedProvider];
    if (!entry) return null;

    const apiKey = this.deps.llmApiKeyCipher.decrypt(key.apiKey);
    return entry.create({ apiKey, model: model ?? key.model, baseUrl: key.baseUrl });
  }

  fromCredentials(credentials: LLMProviderCredentials): ILLMProvider | null {
    const entry = PROVIDER_REGISTRY[credentials.provider];
    if (!entry) return null;

    return entry.create({
      apiKey: credentials.apiKey,
      model: credentials.model ?? null,
      baseUrl: credentials.baseUrl ?? null,
    });
  }
}
