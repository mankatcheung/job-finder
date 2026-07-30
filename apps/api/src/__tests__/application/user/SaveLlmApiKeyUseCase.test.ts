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
      llmModel: null,
      llmBaseUrl: null,
    });
  });

  it('persists an optional model override for a named provider', async () => {
    const user = makeUser();
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue(user),
    });
    const llmApiKeyCipher = makeLlmApiKeyCipher();

    await new SaveLlmApiKeyUseCase({ userRepository, llmApiKeyCipher }).execute({
      userId: 'user-1',
      provider: 'openai',
      apiKey: 'sk-123',
      model: 'gpt-4o',
    });

    expect(userRepository.update).toHaveBeenCalledWith('user-1', {
      llmProvider: 'openai',
      llmApiKey: 'encrypted:sk-123',
      llmModel: 'gpt-4o',
      llmBaseUrl: null,
    });
  });

  it('throws VALIDATION when a baseUrl is given for a named (non-custom) provider', async () => {
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(makeUser()),
    });
    const llmApiKeyCipher = makeLlmApiKeyCipher();

    const err = await new SaveLlmApiKeyUseCase({ userRepository, llmApiKeyCipher })
      .execute({
        userId: 'user-1',
        provider: 'openai',
        apiKey: 'sk-123',
        baseUrl: 'https://example.com',
      })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
  });

  it('throws VALIDATION when the custom provider is missing a base URL', async () => {
    const userRepository = makeUserRepository();
    const llmApiKeyCipher = makeLlmApiKeyCipher();

    const err = await new SaveLlmApiKeyUseCase({ userRepository, llmApiKeyCipher })
      .execute({ userId: 'user-1', provider: 'custom', apiKey: 'sk-123', model: 'some-model' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect((err as Error).message).toMatch(/base URL is required/);
  });

  it('throws VALIDATION when the custom provider base URL is malformed', async () => {
    const userRepository = makeUserRepository();
    const llmApiKeyCipher = makeLlmApiKeyCipher();

    const err = await new SaveLlmApiKeyUseCase({ userRepository, llmApiKeyCipher })
      .execute({
        userId: 'user-1',
        provider: 'custom',
        apiKey: 'sk-123',
        model: 'some-model',
        baseUrl: 'not-a-url',
      })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect((err as Error).message).toMatch(/valid http/);
  });

  it('throws VALIDATION when the custom provider is missing a model', async () => {
    const userRepository = makeUserRepository();
    const llmApiKeyCipher = makeLlmApiKeyCipher();

    const err = await new SaveLlmApiKeyUseCase({ userRepository, llmApiKeyCipher })
      .execute({
        userId: 'user-1',
        provider: 'custom',
        apiKey: 'sk-123',
        baseUrl: 'https://my-llm.example.com/v1/chat/completions',
      })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect((err as Error).message).toMatch(/model is required/);
  });

  it('persists baseUrl and model for a valid custom provider', async () => {
    const user = makeUser();
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue(user),
    });
    const llmApiKeyCipher = makeLlmApiKeyCipher();

    await new SaveLlmApiKeyUseCase({ userRepository, llmApiKeyCipher }).execute({
      userId: 'user-1',
      provider: 'custom',
      apiKey: 'sk-123',
      model: 'my-model',
      baseUrl: 'https://my-llm.example.com/v1/chat/completions',
    });

    expect(userRepository.update).toHaveBeenCalledWith('user-1', {
      llmProvider: 'custom',
      llmApiKey: 'encrypted:sk-123',
      llmModel: 'my-model',
      llmBaseUrl: 'https://my-llm.example.com/v1/chat/completions',
    });
  });
});
