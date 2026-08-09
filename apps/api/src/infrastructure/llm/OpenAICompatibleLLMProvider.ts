import type {
  ILLMProvider,
  LLMMessage,
  LLMToolDefinition,
  LLMCompletionResult,
  LLMToolCall,
} from '#src/use-cases/ports/ILLMProvider.js';
import { AUTH_HEADER, LLM } from '#src/constants.js';
import { fetchWithRetry } from '#src/infrastructure/llm/fetchWithRetry.js';

interface OpenAIWireMessage {
  role: string;
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

interface OpenAIWireResponse {
  choices: Array<{
    message: {
      content: string | null;
      tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
    };
  }>;
}

/**
 * Covers every provider that implements OpenAI's `/chat/completions` request
 * and response shape — OpenAI itself, OpenRouter, Mistral, Groq, xAI,
 * DeepSeek, and any user-supplied custom endpoint. Only the base URL and
 * default model differ between them, which the caller supplies.
 */
export class OpenAICompatibleLLMProvider implements ILLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly model: string,
  ) {}

  async complete(
    messages: LLMMessage[],
    maxTokens: number = LLM.DEFAULT_MAX_TOKENS,
  ): Promise<string> {
    if (!this.apiKey) throw new Error('API key is not set');

    const json = await this.post({
      model: this.model,
      messages: this.toWireMessages(messages),
      max_tokens: Math.min(maxTokens, LLM.MAX_OUTPUT_TOKENS_CAP),
    });

    return json.choices[0]?.message?.content ?? '';
  }

  async completeWithTools(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    maxTokens: number = LLM.DEFAULT_MAX_TOKENS,
  ): Promise<LLMCompletionResult> {
    if (!this.apiKey) throw new Error('API key is not set');

    const json = await this.post({
      model: this.model,
      messages: this.toWireMessages(messages),
      max_tokens: Math.min(maxTokens, LLM.MAX_OUTPUT_TOKENS_CAP),
      tools: tools.map((t) => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      })),
    });

    const message = json.choices[0]?.message;
    const toolCalls: LLMToolCall[] = (message?.tool_calls ?? []).map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: this.parseArguments(tc.function.arguments),
    }));

    return { content: message?.content ?? null, toolCalls };
  }

  private toWireMessages(messages: LLMMessage[]): OpenAIWireMessage[] {
    return messages.map((m) => {
      if (m.role === 'tool') {
        return { role: 'tool', tool_call_id: m.toolCallId, content: m.content };
      }
      if (m.role === 'assistant' && m.toolCalls?.length) {
        return {
          role: 'assistant',
          content: m.content || null,
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
          })),
        };
      }
      return { role: m.role, content: m.content };
    });
  }

  private parseArguments(raw: string): Record<string, unknown> {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private async post(body: Record<string, unknown>): Promise<OpenAIWireResponse> {
    const response = await fetchWithRetry(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${AUTH_HEADER.BEARER_PREFIX}${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LLM provider error ${response.status}: ${text}`);
    }

    return response.json() as Promise<OpenAIWireResponse>;
  }
}
