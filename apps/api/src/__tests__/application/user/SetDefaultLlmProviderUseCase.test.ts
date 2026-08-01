import { describe, it, expect, vi } from 'vitest';
import { SetDefaultLlmProviderUseCase } from '#src/use-cases/user/SetDefaultLlmProviderUseCase.js';
import {
  makeUserRepository,
  makeUser,
  makeLlmApiKeyRepository,
  makeLlmApiKey,
} from '#src/__tests__/helpers/mocks.js';

describe('SetDefaultLlmProviderUseCase', () => {
  it('throws VALIDATION when the user has no key for that provider', async () => {
    const userRepository = makeUserRepository();
    const llmApiKeyRepository = makeLlmApiKeyRepository({
      findByUserIdAndProvider: vi.fn().mockResolvedValue(null),
    });

    const err = await new SetDefaultLlmProviderUseCase({ userRepository, llmApiKeyRepository })
      .execute({ userId: 'user-1', provider: 'openai' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('sets the default provider when a matching key exists', async () => {
    const user = makeUser();
    const userRepository = makeUserRepository({
      update: vi.fn().mockResolvedValue(user),
    });
    const llmApiKeyRepository = makeLlmApiKeyRepository({
      findByUserIdAndProvider: vi.fn().mockResolvedValue(makeLlmApiKey({ provider: 'openai' })),
    });

    await new SetDefaultLlmProviderUseCase({ userRepository, llmApiKeyRepository }).execute({
      userId: 'user-1',
      provider: 'openai',
    });

    expect(userRepository.update).toHaveBeenCalledWith('user-1', { defaultLlmProvider: 'openai' });
  });
});
