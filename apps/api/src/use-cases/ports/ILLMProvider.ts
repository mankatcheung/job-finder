export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ILLMProvider {
  complete(messages: LLMMessage[], maxTokens?: number): Promise<string>;
}
