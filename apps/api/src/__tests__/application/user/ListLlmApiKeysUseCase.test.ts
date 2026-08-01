import { describe, it, expect, vi } from 'vitest';
import { ListLlmApiKeysUseCase } from '#src/use-cases/user/ListLlmApiKeysUseCase.js';
import { makeLlmApiKeyRepository, makeLlmApiKey } from '#src/__tests__/helpers/mocks.js';

describe('ListLlmApiKeysUseCase', () => {
  it('returns all keys configured for the user', async () => {
    const keys = [makeLlmApiKey({ provider: 'openai' }), makeLlmApiKey({ provider: 'anthropic' })];
    const llmApiKeyRepository = makeLlmApiKeyRepository({
      findAllByUserId: vi.fn().mockResolvedValue(keys),
    });

    const result = await new ListLlmApiKeysUseCase({ llmApiKeyRepository }).execute('user-1');

    expect(llmApiKeyRepository.findAllByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(keys);
  });
});
