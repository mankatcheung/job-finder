import { describe, it, expect, vi } from 'vitest';
import { ClearLlmApiKeyUseCase } from '#src/use-cases/user/ClearLlmApiKeyUseCase.js';
import { makeUserRepository, makeUser } from '#src/__tests__/helpers/mocks.js';

describe('ClearLlmApiKeyUseCase', () => {
  it('throws NOT_FOUND when the user does not exist', async () => {
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(null) });

    const err = await new ClearLlmApiKeyUseCase({ userRepository })
      .execute('missing')
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('clears the provider, key, model, and base URL', async () => {
    const user = makeUser({
      llmProvider: 'custom',
      llmApiKey: 'encrypted:key',
      llmModel: 'my-model',
      llmBaseUrl: 'https://my-llm.example.com/v1/chat/completions',
    });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue(user),
    });

    await new ClearLlmApiKeyUseCase({ userRepository }).execute('user-1');

    expect(userRepository.update).toHaveBeenCalledWith('user-1', {
      llmProvider: null,
      llmApiKey: null,
      llmModel: null,
      llmBaseUrl: null,
    });
  });
});
