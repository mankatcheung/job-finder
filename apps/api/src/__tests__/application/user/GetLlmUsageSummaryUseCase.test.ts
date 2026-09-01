import { describe, it, expect, vi } from 'vitest';
import { GetLlmUsageSummaryUseCase } from '#src/use-cases/user/GetLlmUsageSummaryUseCase.js';
import {
  makeLlmUsageEventRepository,
  makeLlmApiKeyRepository,
  makeLlmApiKey,
} from '#src/__tests__/helpers/mocks.js';

describe('GetLlmUsageSummaryUseCase', () => {
  it('attaches an estimated cost using the currently-configured model for that provider', async () => {
    const lastUsedAt = new Date('2026-01-01T00:00:00.000Z');
    const llmUsageEventRepository = makeLlmUsageEventRepository({
      summarizeByUserId: vi.fn().mockResolvedValue([
        {
          provider: 'openai',
          requestCount: 2,
          promptTokens: 1_000_000,
          completionTokens: 1_000_000,
          lastUsedAt,
        },
      ]),
    });
    const llmApiKeyRepository = makeLlmApiKeyRepository({
      findAllByUserId: vi
        .fn()
        .mockResolvedValue([makeLlmApiKey({ provider: 'openai', model: 'gpt-4o-mini' })]),
    });

    const result = await new GetLlmUsageSummaryUseCase({
      llmUsageEventRepository,
      llmApiKeyRepository,
    }).execute('user-1');

    expect(result).toEqual([
      {
        provider: 'openai',
        requestCount: 2,
        promptTokens: 1_000_000,
        completionTokens: 1_000_000,
        lastUsedAt,
        estimatedCostUsd: 0.15 + 0.6,
      },
    ]);
  });

  it('returns a null estimated cost when the provider has no configured key (model unknown)', async () => {
    const llmUsageEventRepository = makeLlmUsageEventRepository({
      summarizeByUserId: vi.fn().mockResolvedValue([
        {
          provider: 'openai',
          requestCount: 1,
          promptTokens: 100,
          completionTokens: 50,
          lastUsedAt: new Date(),
        },
      ]),
    });
    const llmApiKeyRepository = makeLlmApiKeyRepository({
      findAllByUserId: vi.fn().mockResolvedValue([]),
    });

    const result = await new GetLlmUsageSummaryUseCase({
      llmUsageEventRepository,
      llmApiKeyRepository,
    }).execute('user-1');

    expect(result[0].estimatedCostUsd).toBeNull();
  });

  it('returns an empty array when nothing has been recorded', async () => {
    const llmUsageEventRepository = makeLlmUsageEventRepository({
      summarizeByUserId: vi.fn().mockResolvedValue([]),
    });
    const llmApiKeyRepository = makeLlmApiKeyRepository();

    const result = await new GetLlmUsageSummaryUseCase({
      llmUsageEventRepository,
      llmApiKeyRepository,
    }).execute('user-1');

    expect(result).toEqual([]);
  });
});
