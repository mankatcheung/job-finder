import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsageTrackingLLMProvider } from '#src/infrastructure/llm/UsageTrackingLLMProvider.js';
import type { ILLMProvider, LLMStreamEvent } from '#src/use-cases/ports/ILLMProvider.js';
import type { ILlmUsageEventRepository } from '#src/use-cases/ports/ILlmUsageEventRepository.js';

function makeInner(overrides?: Partial<ILLMProvider>): ILLMProvider {
  return {
    complete: vi.fn().mockResolvedValue({ content: 'ok', usage: null }),
    completeWithToolsStream: vi.fn(async function* (): AsyncGenerator<LLMStreamEvent> {
      yield { type: 'done', content: 'ok', toolCalls: [], usage: null };
    }),
    ...overrides,
  };
}

function makeRepo(overrides?: Partial<ILlmUsageEventRepository>): ILlmUsageEventRepository {
  return {
    record: vi.fn().mockResolvedValue(undefined),
    summarizeByUserId: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe('UsageTrackingLLMProvider', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('complete', () => {
    it('records a usage event when the inner provider reports usage', async () => {
      const inner = makeInner({
        complete: vi
          .fn()
          .mockResolvedValue({ content: 'ok', usage: { promptTokens: 10, completionTokens: 5 } }),
      });
      const usageEventRepository = makeRepo();
      const provider = new UsageTrackingLLMProvider({
        inner,
        usageEventRepository,
        generateId: () => 'evt-1',
        userId: 'user-1',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      const result = await provider.complete([{ role: 'user', content: 'hi' }]);

      expect(result.content).toBe('ok');
      expect(usageEventRepository.record).toHaveBeenCalledWith({
        id: 'evt-1',
        userId: 'user-1',
        provider: 'openai',
        model: 'gpt-4o-mini',
        promptTokens: 10,
        completionTokens: 5,
      });
    });

    it('records nothing when the inner provider reports no usage', async () => {
      const inner = makeInner();
      const usageEventRepository = makeRepo();
      const provider = new UsageTrackingLLMProvider({
        inner,
        usageEventRepository,
        generateId: () => 'evt-1',
        userId: 'user-1',
        provider: 'openai',
        model: null,
      });

      await provider.complete([{ role: 'user', content: 'hi' }]);

      expect(usageEventRepository.record).not.toHaveBeenCalled();
    });

    it('fails open — a usage-recording error never surfaces to the caller', async () => {
      const inner = makeInner({
        complete: vi
          .fn()
          .mockResolvedValue({ content: 'ok', usage: { promptTokens: 10, completionTokens: 5 } }),
      });
      const usageEventRepository = makeRepo({
        record: vi.fn().mockRejectedValue(new Error('db down')),
      });
      const provider = new UsageTrackingLLMProvider({
        inner,
        usageEventRepository,
        generateId: () => 'evt-1',
        userId: 'user-1',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });

      const result = await provider.complete([{ role: 'user', content: 'hi' }]);

      expect(result.content).toBe('ok');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('completeWithToolsStream', () => {
    it('records a usage event from the done event and still yields every event', async () => {
      const inner = makeInner({
        completeWithToolsStream: vi.fn(async function* (): AsyncGenerator<LLMStreamEvent> {
          yield { type: 'text_delta', text: 'hi' };
          yield {
            type: 'done',
            content: 'hi',
            toolCalls: [],
            usage: { promptTokens: 20, completionTokens: 8 },
          };
        }),
      });
      const usageEventRepository = makeRepo();
      const provider = new UsageTrackingLLMProvider({
        inner,
        usageEventRepository,
        generateId: () => 'evt-2',
        userId: 'user-1',
        provider: 'anthropic',
        model: null,
      });

      const events = [];
      for await (const event of provider.completeWithToolsStream(
        [{ role: 'user', content: 'hi' }],
        [],
      )) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
      expect(usageEventRepository.record).toHaveBeenCalledWith({
        id: 'evt-2',
        userId: 'user-1',
        provider: 'anthropic',
        model: null,
        promptTokens: 20,
        completionTokens: 8,
      });
    });
  });
});
