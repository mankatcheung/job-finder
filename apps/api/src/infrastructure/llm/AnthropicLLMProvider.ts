import type {
  ILLMProvider,
  LLMMessage,
  LLMToolDefinition,
  LLMCompletionResult,
  LLMToolCall,
} from '#src/use-cases/ports/ILLMProvider.js';
import { LLM } from '#src/constants.js';

type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };

interface AnthropicWireMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

interface AnthropicWireResponse {
  content?: AnthropicContentBlock[];
}

export class AnthropicLLMProvider implements ILLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = LLM.ANTHROPIC_DEFAULT_MODEL,
  ) {}

  async complete(messages: LLMMessage[], maxTokens = 512): Promise<string> {
    if (!this.apiKey) throw new Error('Anthropic API key is not set');

    const { system, conversation } = this.splitSystem(messages);
    const json = await this.post({
      model: this.model,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages: conversation.map((m) => ({ role: m.role, content: m.content })),
    });

    return json.content?.find((block) => block.type === 'text')?.text ?? '';
  }

  async completeWithTools(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    maxTokens = 512,
  ): Promise<LLMCompletionResult> {
    if (!this.apiKey) throw new Error('Anthropic API key is not set');

    const { system, conversation } = this.splitSystem(messages);
    const json = await this.post({
      model: this.model,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages: this.toWireMessages(conversation),
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      })),
    });

    const blocks = json.content ?? [];
    const text =
      blocks.find((b): b is { type: 'text'; text: string } => b.type === 'text')?.text ?? null;
    const toolCalls: LLMToolCall[] = blocks
      .filter(
        (b): b is { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> } =>
          b.type === 'tool_use',
      )
      .map((b) => ({ id: b.id, name: b.name, arguments: b.input }));

    return { content: text, toolCalls };
  }

  private splitSystem(messages: LLMMessage[]): { system: string; conversation: LLMMessage[] } {
    // Anthropic's Messages API takes the system prompt as a separate
    // top-level field rather than a message with role "system".
    const system = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');
    const conversation = messages.filter((m) => m.role !== 'system');
    return { system, conversation };
  }

  private toWireMessages(messages: LLMMessage[]): AnthropicWireMessage[] {
    return messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: m.toolCallId ?? '', content: m.content }],
        };
      }
      if (m.role === 'assistant' && m.toolCalls?.length) {
        const blocks: AnthropicContentBlock[] = [
          ...(m.content ? [{ type: 'text' as const, text: m.content }] : []),
          ...m.toolCalls.map((tc) => ({
            type: 'tool_use' as const,
            id: tc.id,
            name: tc.name,
            input: tc.arguments,
          })),
        ];
        return { role: 'assistant', content: blocks };
      }
      return { role: m.role as 'user' | 'assistant', content: m.content };
    });
  }

  private async post(body: Record<string, unknown>): Promise<AnthropicWireResponse> {
    const response = await fetch(LLM.ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': LLM.ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic error ${response.status}: ${text}`);
    }

    return response.json() as Promise<AnthropicWireResponse>;
  }
}
