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
}

export interface LLMToolDefinition {
  name: string;
  description: string;
  /** JSON Schema object describing the tool's arguments. */
  parameters: Record<string, unknown>;
}

export interface LLMCompletionResult {
  content: string | null;
  toolCalls: LLMToolCall[];
}

export interface ILLMProvider {
  complete(messages: LLMMessage[], maxTokens?: number): Promise<string>;
  completeWithTools(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    maxTokens?: number,
  ): Promise<LLMCompletionResult>;
}
