import { describe, it, expect, vi } from 'vitest';
import { LimitEnforcingLLMProviderFactory } from '#src/infrastructure/llm/LimitEnforcingLLMProviderFactory.js';
import { LlmLimitReachedError } from '#src/use-cases/errors/DomainError.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';
import {
  makeLlmApiKey,
  makeLlmApiKeyRepository,
  makeLlmUsageEventRepository,
} from '#src/__tests__/helpers/mocks/llm.js';
import { makeUser, makeUserRepository } from '#src/__tests__/helpers/mocks/user.js';

const NOW = new Date('2026-03-15T12:00:00.000Z');

const usage = (promptTokens: number, completionTokens: number, provider = 'openai') => [
  {
    provider,
    requestCount: 1,
    promptTokens,
    completionTokens,
    lastUsedAt: NOW,
  },
];

function build({
  key = makeLlmApiKey({ provider: 'openai', monthlyTokenLimit: null }),
  summaries = [] as ReturnType<typeof usage>,
  defaultLlmProvider = 'openai' as string | null,
}) {
  const provider = { complete: vi.fn(), completeWithToolsStream: vi.fn() };
  const inner = {
    forUser: vi.fn().mockResolvedValue(provider),
    fromCredentials: vi.fn().mockReturnValue(provider),
  };
  const factory = new LimitEnforcingLLMProviderFactory({
    userLlmProviderFactory: inner,
    userRepository: makeUserRepository({
      findById: vi.fn().mockResolvedValue(makeUser({ defaultLlmProvider })),
    }),
    llmApiKeyRepository: makeLlmApiKeyRepository({
      findByUserIdAndProvider: vi.fn().mockResolvedValue(key),
    }),
    llmUsageEventRepository: makeLlmUsageEventRepository({
      summarizeByUserId: vi.fn().mockResolvedValue(summaries),
    }),
    now: () => NOW,
  });
  return { factory, inner, provider };
}

describe('LimitEnforcingLLMProviderFactory', () => {
  it('passes through when the key has no limit', async () => {
    const { factory, inner, provider } = build({ summaries: usage(9_999_999, 0) });

    await expect(factory.forUser('user-1', 'openai')).resolves.toBe(provider);
    expect(inner.forUser).toHaveBeenCalledWith('user-1', 'openai', undefined, true);
  });

  it('passes through while usage is below the limit', async () => {
    const { factory, provider } = build({
      key: makeLlmApiKey({ provider: 'openai', monthlyTokenLimit: 200 }),
      summaries: usage(100, 99),
    });

    await expect(factory.forUser('user-1', 'openai')).resolves.toBe(provider);
  });

  it('refuses once the combined tokens meet the limit', async () => {
    const { factory, inner } = build({
      key: makeLlmApiKey({ provider: 'openai', monthlyTokenLimit: 200 }),
      summaries: usage(100, 100),
    });

    await expect(factory.forUser('user-1', 'openai')).rejects.toThrow(LlmLimitReachedError);
    expect(inner.forUser).not.toHaveBeenCalled();
  });

  it('reports the provider and when the allowance refills', async () => {
    const { factory } = build({
      key: makeLlmApiKey({ provider: 'openai', monthlyTokenLimit: 10 }),
      summaries: usage(10, 0),
    });

    await expect(factory.forUser('user-1', 'openai')).rejects.toMatchObject({
      provider: 'openai',
      resetsAt: new Date('2026-04-01T00:00:00.000Z'),
      code: ERROR_CODES.AI_LIMIT_REACHED,
    });
  });

  it('resolves the default provider when none is named', async () => {
    const { factory, inner } = build({
      key: makeLlmApiKey({ provider: 'openai', monthlyTokenLimit: 10 }),
      summaries: usage(10, 0),
      defaultLlmProvider: 'openai',
    });

    await expect(factory.forUser('user-1')).rejects.toThrow(LlmLimitReachedError);
    expect(inner.forUser).not.toHaveBeenCalled();
  });

  /**
   * "No provider configured" is the inner factory's to report — it returns
   * null and the caller raises AI_NOT_CONFIGURED. Answering it here would
   * tell the user to raise a limit on a key they do not have.
   */
  it('defers to the inner factory when the user has no default provider', async () => {
    const { factory, inner } = build({ defaultLlmProvider: null });

    await factory.forUser('user-1');

    expect(inner.forUser).toHaveBeenCalled();
  });

  /**
   * `trackUsage: false` marks a call whose tokens are not counted — today
   * only "test a saved key". A call that cannot reach the limit must not be
   * refused by it, or the one button that diagnoses a paused key is gone.
   */
  it('does not enforce a limit on an untracked call', async () => {
    const { factory, provider } = build({
      key: makeLlmApiKey({ provider: 'openai', monthlyTokenLimit: 10 }),
      summaries: usage(9_999, 0),
    });

    await expect(factory.forUser('user-1', 'openai', null, false)).resolves.toBe(provider);
  });

  it('leaves fromCredentials alone — there is no saved key to have a limit', () => {
    const { factory, inner, provider } = build({
      key: makeLlmApiKey({ provider: 'openai', monthlyTokenLimit: 1 }),
      summaries: usage(9_999, 0),
    });

    expect(factory.fromCredentials({ provider: 'openai', apiKey: 'sk-test' })).toBe(provider);
    expect(inner.fromCredentials).toHaveBeenCalled();
  });

  it('ignores another provider’s usage', async () => {
    const { factory, provider } = build({
      key: makeLlmApiKey({ provider: 'openai', monthlyTokenLimit: 200 }),
      summaries: usage(9_999, 0, 'anthropic'),
    });

    await expect(factory.forUser('user-1', 'openai')).resolves.toBe(provider);
  });

  it('allows a limited key with no usage yet this month', async () => {
    const { factory, provider } = build({
      key: makeLlmApiKey({ provider: 'openai', monthlyTokenLimit: 200 }),
      summaries: [],
    });

    await expect(factory.forUser('user-1', 'openai')).resolves.toBe(provider);
  });
});
