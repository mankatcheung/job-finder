export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  /** Present on a 'tool' message: which tool call this is the result for. */
  toolCallId?: string;
  /** Present on an 'assistant' message that requested tool calls. */
  toolCalls?: LLMToolCall[];
  /**
   * Marks this as the end of a cacheable prefix (cache everything up to and
   * including this block). Providers with explicit cache control (Anthropic)
   * act on it; providers that cache automatically (OpenAI-compatible, Google
   * AI) simply ignore it.
   */
  cacheBreakpoint?: boolean;
}

export interface LLMToolDefinition {
  name: string;
  description: string;
  /** JSON Schema object describing the tool's arguments. */
  parameters: Record<string, unknown>;
  /** See `LLMMessage.cacheBreakpoint` — same semantics, applied to the tools list. */
  cacheBreakpoint?: boolean;
}

/**
 * Return shape of a fully-assembled tool-calling completion — not on
 * `ILLMProvider` itself (no provider exposes a non-streaming tool-calling
 * method; see JEF-245), but still the shape `LLMStreamEvent`'s `done` event
 * carries, and what `GoogleAILLMProvider` returns from its own internal,
 * non-port `completeWithTools` (Gemini doesn't genuinely stream — see that
 * class).
 */
export interface LLMCompletionResult {
  content: string | null;
  toolCalls: LLMToolCall[];
}

/**
 * Emitted by `completeWithToolsStream` (JEF-239). `text_delta` events carry
 * incremental assistant text as it arrives; exactly one `done` carries the
 * fully-assembled result (`LLMCompletionResult`'s shape) and always
 * terminates the stream, whether or not any deltas preceded it. Providers
 * that don't genuinely stream (Google — see `GoogleAILLMProvider`) satisfy
 * this by yielding only the `done` event.
 */
export type LLMStreamEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'done'; content: string | null; toolCalls: LLMToolCall[] };

export interface ILLMProvider {
  complete(messages: LLMMessage[], maxTokens?: number, signal?: AbortSignal): Promise<string>;
  completeWithToolsStream(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    maxTokens?: number,
    signal?: AbortSignal,
  ): AsyncGenerator<LLMStreamEvent>;
}
