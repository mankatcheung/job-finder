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

export interface LLMCompletionResult {
  content: string | null;
  toolCalls: LLMToolCall[];
}

export interface ILLMProvider {
  complete(messages: LLMMessage[], maxTokens?: number, signal?: AbortSignal): Promise<string>;
  completeWithTools(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    maxTokens?: number,
    signal?: AbortSignal,
  ): Promise<LLMCompletionResult>;
}
