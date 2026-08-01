import type { IUserRepository } from '#src/use-cases/ports/IUserRepository.js';
import type { ILlmApiKeyRepository } from '#src/use-cases/ports/ILlmApiKeyRepository.js';
import type { ILlmApiKeyCipher } from '#src/use-cases/ports/ILlmApiKeyCipher.js';
import { ERROR_CODES, LLM_PROVIDER } from '#src/constants.js';
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
      throw Object.assign(new Error('Unsupported AI provider'), { code: ERROR_CODES.VALIDATION });
    }
    if (!input.apiKey.trim()) {
      throw Object.assign(new Error('API key is required'), { code: ERROR_CODES.VALIDATION });
    }

    const isCustom = input.provider === LLM_PROVIDER.CUSTOM;
    const baseUrl = input.baseUrl?.trim() || null;
    const model = input.model?.trim() || null;

    if (isCustom) {
      if (!baseUrl) {
        throw Object.assign(new Error('A base URL is required for a custom provider'), {
          code: ERROR_CODES.VALIDATION,
        });
      }
      if (!isValidUrl(baseUrl)) {
        throw Object.assign(new Error('Base URL must be a valid http(s) URL'), {
          code: ERROR_CODES.VALIDATION,
        });
      }
      if (!model) {
        throw Object.assign(new Error('A model is required for a custom provider'), {
          code: ERROR_CODES.VALIDATION,
        });
      }
    } else if (baseUrl) {
      throw Object.assign(new Error('A base URL can only be set for a custom provider'), {
        code: ERROR_CODES.VALIDATION,
      });
    }

    const user = await this.deps.userRepository.findById(input.userId);
    if (!user) throw Object.assign(new Error('User not found'), { code: ERROR_CODES.NOT_FOUND });

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
