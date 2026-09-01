import { describe, it, expect, vi } from 'vitest';
import { TestLlmApiKeyUseCase } from '#src/use-cases/user/TestLlmApiKeyUseCase.js';
import { LLM } from '#src/use-cases/constants.js';
import {
  makeLLMProviderFactory,
  makeLLMProvider,
  makeRateLimiter,
} from '#src/__tests__/helpers/mocks.js';

describe('TestLlmApiKeyUseCase', () => {
  it('throws RATE_LIMITED when the limiter denies the attempt', async () => {
    const testLlmApiKeyRateLimiter = makeRateLimiter({ consume: vi.fn().mockResolvedValue(false) });
    const llmProviderFactory = makeLLMProviderFactory();

    const err = await new TestLlmApiKeyUseCase({ llmProviderFactory, testLlmApiKeyRateLimiter })
      .execute({ userId: 'user-1', provider: 'openrouter' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('RATE_LIMITED');
    expect(llmProviderFactory.forUser).not.toHaveBeenCalled();
  });

  it('throws VALIDATION for an unsupported provider (saved-key path)', async () => {
    const testLlmApiKeyRateLimiter = makeRateLimiter();
    const llmProviderFactory = makeLLMProviderFactory();

    const err = await new TestLlmApiKeyUseCase({ llmProviderFactory, testLlmApiKeyRateLimiter })
      .execute({ userId: 'user-1', provider: 'not-a-provider' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
  });

  it('throws VALIDATION for an unsupported provider (unsaved-key path)', async () => {
    const testLlmApiKeyRateLimiter = makeRateLimiter();
    const llmProviderFactory = makeLLMProviderFactory();

    const err = await new TestLlmApiKeyUseCase({ llmProviderFactory, testLlmApiKeyRateLimiter })
      .execute({ userId: 'user-1', provider: 'not-a-provider', apiKey: 'sk-123' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
  });

  it('throws VALIDATION when a custom provider is missing a base URL', async () => {
    const testLlmApiKeyRateLimiter = makeRateLimiter();
    const llmProviderFactory = makeLLMProviderFactory();

    const err = await new TestLlmApiKeyUseCase({ llmProviderFactory, testLlmApiKeyRateLimiter })
      .execute({
        userId: 'user-1',
        provider: 'custom',
        apiKey: 'sk-123',
        model: 'some-model',
      })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect((err as Error).message).toMatch(/base URL is required/);
  });

  it('throws AI_NOT_CONFIGURED when no key is saved for the provider and none was given', async () => {
    const testLlmApiKeyRateLimiter = makeRateLimiter();
    const llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(null),
    });

    const err = await new TestLlmApiKeyUseCase({ llmProviderFactory, testLlmApiKeyRateLimiter })
      .execute({ userId: 'user-1', provider: 'openai' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('AI_NOT_CONFIGURED');
  });

  it('resolves the saved key via llmProviderFactory.forUser when apiKey is omitted', async () => {
    const testLlmApiKeyRateLimiter = makeRateLimiter();
    const provider = makeLLMProvider();
    const llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(provider),
    });

    const result = await new TestLlmApiKeyUseCase({
      llmProviderFactory,
      testLlmApiKeyRateLimiter,
    }).execute({ userId: 'user-1', provider: 'openai' });

    // trackUsage: false — testing a saved key is a connectivity check, not
    // real usage (JEF-250).
    expect(llmProviderFactory.forUser).toHaveBeenCalledWith('user-1', 'openai', undefined, false);
    expect(llmProviderFactory.fromCredentials).not.toHaveBeenCalled();
    expect(provider.complete).toHaveBeenCalledWith(
      [{ role: 'user', content: expect.any(String) }],
      LLM.TEST_API_KEY_MAX_TOKENS,
    );
    expect(result).toEqual({ ok: true });
  });

  it('builds the provider directly via fromCredentials when apiKey is given, without touching the saved key', async () => {
    const testLlmApiKeyRateLimiter = makeRateLimiter();
    const provider = makeLLMProvider();
    const llmProviderFactory = makeLLMProviderFactory({
      fromCredentials: vi.fn().mockReturnValue(provider),
    });

    const result = await new TestLlmApiKeyUseCase({
      llmProviderFactory,
      testLlmApiKeyRateLimiter,
    }).execute({ userId: 'user-1', provider: 'openai', apiKey: '  sk-123  ' });

    expect(llmProviderFactory.forUser).not.toHaveBeenCalled();
    expect(llmProviderFactory.fromCredentials).toHaveBeenCalledWith({
      provider: 'openai',
      apiKey: 'sk-123',
      model: null,
      baseUrl: null,
    });
    expect(result).toEqual({ ok: true });
  });

  it('passes baseUrl/model through for a custom provider and drops baseUrl for a named one', async () => {
    const testLlmApiKeyRateLimiter = makeRateLimiter();
    const llmProviderFactory = makeLLMProviderFactory();

    await new TestLlmApiKeyUseCase({ llmProviderFactory, testLlmApiKeyRateLimiter }).execute({
      userId: 'user-1',
      provider: 'custom',
      apiKey: 'sk-123',
      model: 'my-model',
      baseUrl: 'https://my-llm.example.com/v1/chat/completions',
    });

    expect(llmProviderFactory.fromCredentials).toHaveBeenCalledWith({
      provider: 'custom',
      apiKey: 'sk-123',
      model: 'my-model',
      baseUrl: 'https://my-llm.example.com/v1/chat/completions',
    });

    vi.mocked(llmProviderFactory.fromCredentials).mockClear();

    await new TestLlmApiKeyUseCase({ llmProviderFactory, testLlmApiKeyRateLimiter }).execute({
      userId: 'user-1',
      provider: 'openai',
      apiKey: 'sk-123',
      // A baseUrl on a named (non-custom) provider is a validation error, so
      // omit it here — this case only checks that baseUrl isn't forwarded
      // even when a model is given.
      model: 'gpt-4o',
    });

    expect(llmProviderFactory.fromCredentials).toHaveBeenCalledWith({
      provider: 'openai',
      apiKey: 'sk-123',
      model: 'gpt-4o',
      baseUrl: null,
    });
  });

  it('returns ok:false with the error message when the provider call fails, without throwing', async () => {
    const testLlmApiKeyRateLimiter = makeRateLimiter();
    const provider = makeLLMProvider();
    vi.mocked(provider.complete).mockRejectedValue(new Error('LLM provider error 401: bad key'));
    const llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(provider),
    });

    const result = await new TestLlmApiKeyUseCase({
      llmProviderFactory,
      testLlmApiKeyRateLimiter,
    }).execute({ userId: 'user-1', provider: 'openai' });

    expect(result).toEqual({ ok: false, error: 'LLM provider error 401: bad key' });
  });

  it('returns a generic error message when the provider throws a non-Error value', async () => {
    const testLlmApiKeyRateLimiter = makeRateLimiter();
    const provider = makeLLMProvider();
    vi.mocked(provider.complete).mockRejectedValue('not an Error');
    const llmProviderFactory = makeLLMProviderFactory({
      forUser: vi.fn().mockResolvedValue(provider),
    });

    const result = await new TestLlmApiKeyUseCase({
      llmProviderFactory,
      testLlmApiKeyRateLimiter,
    }).execute({ userId: 'user-1', provider: 'openai' });

    expect(result).toEqual({ ok: false, error: 'Request failed' });
  });
});
