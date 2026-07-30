import { describe, it, expect, vi } from 'vitest';
import { UserLLMProviderFactory } from '#src/infrastructure/llm/UserLLMProviderFactory.js';
import { OpenRouterLLMProvider } from '#src/infrastructure/llm/OpenRouterLLMProvider.js';
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

  it('returns an OpenRouterLLMProvider with the decrypted key for the openrouter provider', async () => {
    const userRepository = makeUserRepository({
      findById: vi
        .fn()
        .mockResolvedValue(
          makeUser({ llmProvider: LLM_PROVIDER.OPENROUTER, llmApiKey: 'encrypted:my-key' }),
        ),
    });
    const llmApiKeyCipher = makeLlmApiKeyCipher();
    const factory = new UserLLMProviderFactory({ userRepository, llmApiKeyCipher });

    const provider = await factory.forUser('user-1');

    expect(provider).toBeInstanceOf(OpenRouterLLMProvider);
    expect(llmApiKeyCipher.decrypt).toHaveBeenCalledWith('encrypted:my-key');
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
});
