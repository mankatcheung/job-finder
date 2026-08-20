import { NotFoundError, ValidationError } from '#src/use-cases/errors/DomainError.js';
import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { ILlmApiKeyRepository } from '#src/use-cases/ports/ILlmApiKeyRepository.js';
import type { ILlmApiKeyCipher } from '#src/use-cases/ports/ILlmApiKeyCipher.js';
import { LLM_PROVIDER } from '#src/constants.js';
import type {
  ISaveLlmApiKeyUseCase,
  SaveLlmApiKeyInput,
} from '#src/use-cases/user/ISaveLlmApiKeyUseCase.js';

interface Deps {
  userRepository: IUserRepository;
  llmApiKeyRepository: ILlmApiKeyRepository;
  llmApiKeyCipher: ILlmApiKeyCipher;
  generateId: () => string;
}

const VALID_PROVIDERS: string[] = Object.values(LLM_PROVIDER);

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export class SaveLlmApiKeyUseCase implements ISaveLlmApiKeyUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: SaveLlmApiKeyInput): Promise<void> {
    if (!VALID_PROVIDERS.includes(input.provider)) {
      throw new ValidationError('Unsupported AI provider');
    }
    if (!input.apiKey.trim()) {
      throw new ValidationError('API key is required');
    }

    const isCustom = input.provider === LLM_PROVIDER.CUSTOM;
    const baseUrl = input.baseUrl?.trim() || null;
    const model = input.model?.trim() || null;

    if (isCustom) {
      if (!baseUrl) {
        throw new ValidationError('A base URL is required for a custom provider');
      }
      if (!isValidUrl(baseUrl)) {
        throw new ValidationError('Base URL must be a valid http(s) URL');
      }
      if (!model) {
        throw new ValidationError('A model is required for a custom provider');
      }
    } else if (baseUrl) {
      throw new ValidationError('A base URL can only be set for a custom provider');
    }

    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw new NotFoundError('User not found');

    await this.deps.llmApiKeyRepository.upsert({
      id: this.deps.generateId(),
      userId: input.userId,
      provider: input.provider,
      apiKey: this.deps.llmApiKeyCipher.encrypt(input.apiKey.trim()),
      model,
      baseUrl: isCustom ? baseUrl : null,
    });

    // First key ever configured becomes the default for automatic features —
    // otherwise there'd be no default at all until the user visits settings
    // to pick one, silently disabling cover letters/JD parsing/resume match.
    if (!user.defaultLlmProvider) {
      await this.deps.userRepository.update(input.userId, { defaultLlmProvider: input.provider });
    }
  }
}
