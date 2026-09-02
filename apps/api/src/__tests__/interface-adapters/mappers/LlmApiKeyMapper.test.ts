import { describe, it, expect } from 'vitest';
import { LlmApiKeyMapper } from '#src/interface-adapters/mappers/LlmApiKeyMapper.js';
import { makeLlmApiKey } from '#src/__tests__/helpers/mocks/llm.js';

describe('LlmApiKeyMapper', () => {
  it('maps provider, model, and baseUrl but omits the encrypted key, id, and userId', () => {
    const key = makeLlmApiKey({
      id: 'key-1',
      userId: 'user-1',
      provider: 'openai',
      apiKey: 'encrypted:sk-123',
      model: 'gpt-4o',
      baseUrl: null,
    });

    const dto = new LlmApiKeyMapper().toDTO(key);

    expect(dto).toEqual({
      provider: 'openai',
      model: 'gpt-4o',
      baseUrl: null,
      monthlyTokenLimit: null,
    });
    expect(dto).not.toHaveProperty('apiKey');
    expect(dto).not.toHaveProperty('id');
    expect(dto).not.toHaveProperty('userId');
  });
});
