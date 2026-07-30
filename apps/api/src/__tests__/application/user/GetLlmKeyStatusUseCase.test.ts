import { describe, it, expect, vi } from 'vitest';
import { GetLlmKeyStatusUseCase } from '#src/use-cases/user/GetLlmKeyStatusUseCase.js';
import { makeUserRepository, makeUser } from '#src/__tests__/helpers/mocks.js';

describe('GetLlmKeyStatusUseCase', () => {
  it('throws NOT_FOUND when the user does not exist', async () => {
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(null) });

    const err = await new GetLlmKeyStatusUseCase({ userRepository })
      .execute('missing')
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('reports not configured when the user has no key', async () => {
    const user = makeUser({ llmProvider: null, llmApiKey: null });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });

    const result = await new GetLlmKeyStatusUseCase({ userRepository }).execute('user-1');

    expect(result).toEqual({ configured: false, provider: null, model: null, baseUrl: null });
  });

  it('reports configured with the provider when a key is set', async () => {
    const user = makeUser({ llmProvider: 'openrouter', llmApiKey: 'encrypted:key' });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });

    const result = await new GetLlmKeyStatusUseCase({ userRepository }).execute('user-1');

    expect(result).toEqual({
      configured: true,
      provider: 'openrouter',
      model: null,
      baseUrl: null,
    });
  });

  it('reports the stored model and base URL for a custom provider', async () => {
    const user = makeUser({
      llmProvider: 'custom',
      llmApiKey: 'encrypted:key',
      llmModel: 'my-model',
      llmBaseUrl: 'https://my-llm.example.com/v1/chat/completions',
    });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });

    const result = await new GetLlmKeyStatusUseCase({ userRepository }).execute('user-1');

    expect(result).toEqual({
      configured: true,
      provider: 'custom',
      model: 'my-model',
      baseUrl: 'https://my-llm.example.com/v1/chat/completions',
    });
  });
});
