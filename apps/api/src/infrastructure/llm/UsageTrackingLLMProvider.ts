import type {
  ILLMProvider,
  LLMMessage,
  LLMToolDefinition,
  LLMStreamEvent,
  LLMCompleteResult,
  LLMUsage,
} from '#src/use-cases/ports/ILLMProvider.js';
import type { ILlmUsageEventRepository } from '#src/use-cases/ports/ILlmUsageEventRepository.js';

interface Deps {
  inner: ILLMProvider;
  usageEventRepository: ILlmUsageEventRepository;
  generateId: () => string;
  userId: string;
  provider: string;
  model: string | null;
}

/**
 * Decorates an `ILLMProvider` so every completed call also writes a
 * `LlmUsageEvent` (JEF-250) — wired in by `UserLLMProviderFactory.forUser`
 * (the single choke point every real AI feature resolves its provider
 * through), never by `fromCredentials` (the "test before you save" /
 * "test a saved key" path has no usage worth counting).
 *
 * A response with no usage field (see `LLMUsage`'s doc comment) simply
 * records nothing rather than a fabricated zero. Recording itself fails
 * open: a broken usage log must never break the AI feature the user is
 * actually here for.
 */
export class UsageTrackingLLMProvider implements ILLMProvider {
  constructor(private readonly deps: Deps) {}

  async complete(
    messages: LLMMessage[],
    maxTokens?: number,
    signal?: AbortSignal,
  ): Promise<LLMCompleteResult> {
    const result = await this.deps.inner.complete(messages, maxTokens, signal);
    await this.record(result.usage);
    return result;
  }

  async *completeWithToolsStream(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    maxTokens?: number,
    signal?: AbortSignal,
  ): AsyncGenerator<LLMStreamEvent> {
    for await (const event of this.deps.inner.completeWithToolsStream(
      messages,
      tools,
      maxTokens,
      signal,
    )) {
      if (event.type === 'done') await this.record(event.usage);
      yield event;
    }
  }

  private async record(usage: LLMUsage | null): Promise<void> {
    if (!usage) return;
    try {
      await this.deps.usageEventRepository.record({
        id: this.deps.generateId(),
        userId: this.deps.userId,
        provider: this.deps.provider,
        model: this.deps.model,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
      });
    } catch (err) {
      console.error('[llm-usage] failed to record usage event — continuing', err);
    }
  }
}
