import { describe, it, expect, vi } from 'vitest';
import { SaveLlmApiKeyUseCase } from '#src/use-cases/user/SaveLlmApiKeyUseCase.js';
import { makeUserRepository, makeUser, makeLlmApiKeyCipher } from '#src/__tests__/helpers/mocks.js';

describe('SaveLlmApiKeyUseCase', () => {
  it('throws VALIDATION for an unsupported provider', async () => {
    const userRepository = makeUserRepository();
    const llmApiKeyCipher = makeLlmApiKeyCipher();

    const err = await new SaveLlmApiKeyUseCase({ userRepository, llmApiKeyCipher })
      .execute({ userId: 'user-1', provider: 'not-a-provider', apiKey: 'sk-123' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
  });

  it('throws VALIDATION for a blank API key', async () => {
    const userRepository = makeUserRepository();
    const llmApiKeyCipher = makeLlmApiKeyCipher();

    const err = await new SaveLlmApiKeyUseCase({ userRepository, llmApiKeyCipher })
      .execute({ userId: 'user-1', provider: 'openrouter', apiKey: '   ' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
  });

  it('throws NOT_FOUND when the user does not exist', async () => {
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(null) });
    const llmApiKeyCipher = makeLlmApiKeyCipher();

    const err = await new SaveLlmApiKeyUseCase({ userRepository, llmApiKeyCipher })
      .execute({ userId: 'missing', provider: 'openrouter', apiKey: 'sk-123' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('encrypts the key and persists it with the chosen provider', async () => {
    const user = makeUser();
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue(user),
    });
    const llmApiKeyCipher = makeLlmApiKeyCipher();

    await new SaveLlmApiKeyUseCase({ userRepository, llmApiKeyCipher }).execute({
      userId: 'user-1',
      provider: 'googleai',
      apiKey: 'sk-123',
    });

    expect(llmApiKeyCipher.encrypt).toHaveBeenCalledWith('sk-123');
    expect(userRepository.update).toHaveBeenCalledWith('user-1', {
      llmProvider: 'googleai',
      llmApiKey: 'encrypted:sk-123',
    });
  });
});
