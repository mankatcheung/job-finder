import { describe, it, expect, vi } from 'vitest';
import { GetLlmUsageSummaryUseCase } from '#src/use-cases/user/GetLlmUsageSummaryUseCase.js';
import { makeLlmUsageEventRepository } from '#src/__tests__/helpers/mocks.js';

describe('GetLlmUsageSummaryUseCase', () => {
  it('passes the start of the current UTC month as the cutoff', async () => {
    const llmUsageEventRepository = makeLlmUsageEventRepository({
      summarizeByUserId: vi.fn().mockResolvedValue([]),
    });
    const now = () => new Date('2026-03-15T12:34:56.000Z');

    await new GetLlmUsageSummaryUseCase({ llmUsageEventRepository, now }).execute('user-1');

    expect(llmUsageEventRepository.summarizeByUserId).toHaveBeenCalledWith(
      'user-1',
      new Date('2026-03-01T00:00:00.000Z'),
    );
  });

  it('returns the repository result unchanged', async () => {
    const summary = [
      {
        provider: 'openai',
        requestCount: 2,
        promptTokens: 100,
        completionTokens: 40,
        lastUsedAt: new Date('2026-03-15T00:00:00.000Z'),
      },
    ];
    const llmUsageEventRepository = makeLlmUsageEventRepository({
      summarizeByUserId: vi.fn().mockResolvedValue(summary),
    });

    const result = await new GetLlmUsageSummaryUseCase({
      llmUsageEventRepository,
      now: () => new Date('2026-03-15T00:00:00.000Z'),
    }).execute('user-1');

    expect(result).toEqual(summary);
  });
});
