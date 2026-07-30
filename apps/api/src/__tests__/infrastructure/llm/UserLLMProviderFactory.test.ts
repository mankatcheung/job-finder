import { describe, it, expect, vi } from 'vitest';
import { UserLLMProviderFactory } from '#src/infrastructure/llm/UserLLMProviderFactory.js';
import { OpenAICompatibleLLMProvider } from '#src/infrastructure/llm/OpenAICompatibleLLMProvider.js';
import { AnthropicLLMProvider } from '#src/infrastructure/llm/AnthropicLLMProvider.js';
import { GoogleAILLMProvider } from '#src/infrastructure/llm/GoogleAILLMProvider.js';
import { LLM_PROVIDER } from '#src/constants.js';
import { makeUserRepository, makeUser, makeLlmApiKeyCipher } from '#src/__tests__/helpers/mocks.js';

describe('UserLLMProviderFactory', () => {
  it('returns null when the user has no provider configured', async () => {
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(makeUser({ llmProvider: null, llmApiKey: null })),
    });
    const factory = new UserLLMProviderFactory({
      userRepository,
      llmApiKeyCipher: makeLlmApiKeyCipher(),
    });

    expect(await factory.forUser('user-1')).toBeNull();
  });

  it('returns null when the user does not exist', async () => {
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(null) });
    const factory = new UserLLMProviderFactory({
      userRepository,
      llmApiKeyCipher: makeLlmApiKeyCipher(),
    });

    expect(await factory.forUser('missing')).toBeNull();
  });

  it('returns null when the stored provider is not in the registry', async () => {
    const userRepository = makeUserRepository({
      findById: vi
        .fn()
        .mockResolvedValue(makeUser({ llmProvider: 'not-a-real-provider', llmApiKey: 'enc' })),
    });
    const factory = new UserLLMProviderFactory({
      userRepository,
      llmApiKeyCipher: makeLlmApiKeyCipher(),
    });

    expect(await factory.forUser('user-1')).toBeNull();
  });

  it('returns an OpenAICompatibleLLMProvider with the decrypted key for openai', async () => {
    const userRepository = makeUserRepository({
      findById: vi
        .fn()
        .mockResolvedValue(
          makeUser({ llmProvider: LLM_PROVIDER.OPENAI, llmApiKey: 'encrypted:my-key' }),
        ),
    });
    const llmApiKeyCipher = makeLlmApiKeyCipher();
    const factory = new UserLLMProviderFactory({ userRepository, llmApiKeyCipher });

    const provider = await factory.forUser('user-1');

    expect(provider).toBeInstanceOf(OpenAICompatibleLLMProvider);
    expect(llmApiKeyCipher.decrypt).toHaveBeenCalledWith('encrypted:my-key');
  });

  it('returns an OpenAICompatibleLLMProvider for openrouter', async () => {
    const userRepository = makeUserRepository({
      findById: vi
        .fn()
        .mockResolvedValue(
          makeUser({ llmProvider: LLM_PROVIDER.OPENROUTER, llmApiKey: 'encrypted:my-key' }),
        ),
    });
    const factory = new UserLLMProviderFactory({
      userRepository,
      llmApiKeyCipher: makeLlmApiKeyCipher(),
    });

    expect(await factory.forUser('user-1')).toBeInstanceOf(OpenAICompatibleLLMProvider);
  });

  it('returns an AnthropicLLMProvider for anthropic', async () => {
    const userRepository = makeUserRepository({
      findById: vi
        .fn()
        .mockResolvedValue(
          makeUser({ llmProvider: LLM_PROVIDER.ANTHROPIC, llmApiKey: 'encrypted:my-key' }),
        ),
    });
    const factory = new UserLLMProviderFactory({
      userRepository,
      llmApiKeyCipher: makeLlmApiKeyCipher(),
    });

    expect(await factory.forUser('user-1')).toBeInstanceOf(AnthropicLLMProvider);
  });

  it('returns a GoogleAILLMProvider with the decrypted key for the googleai provider', async () => {
    const userRepository = makeUserRepository({
      findById: vi
        .fn()
        .mockResolvedValue(
          makeUser({ llmProvider: LLM_PROVIDER.GOOGLEAI, llmApiKey: 'encrypted:my-key' }),
        ),
    });
    const factory = new UserLLMProviderFactory({
      userRepository,
      llmApiKeyCipher: makeLlmApiKeyCipher(),
    });

    const provider = await factory.forUser('user-1');

    expect(provider).toBeInstanceOf(GoogleAILLMProvider);
  });

  it('builds an OpenAICompatibleLLMProvider from the stored baseUrl/model for the custom provider', async () => {
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(
        makeUser({
          llmProvider: LLM_PROVIDER.CUSTOM,
          llmApiKey: 'encrypted:my-key',
          llmBaseUrl: 'https://my-llm.example.com/v1/chat/completions',
          llmModel: 'my-custom-model',
        }),
      ),
    });
    const factory = new UserLLMProviderFactory({
      userRepository,
      llmApiKeyCipher: makeLlmApiKeyCipher(),
    });

    expect(await factory.forUser('user-1')).toBeInstanceOf(OpenAICompatibleLLMProvider);
  });
});
