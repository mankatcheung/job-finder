import type { ILLMProvider, LLMMessage } from '#src/use-cases/ports/ILLMProvider.js';
import { LLM } from '#src/constants.js';

export class AnthropicLLMProvider implements ILLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = LLM.ANTHROPIC_DEFAULT_MODEL,
  ) {}

  async complete(messages: LLMMessage[], maxTokens = 512): Promise<string> {
    if (!this.apiKey) throw new Error('Anthropic API key is not set');

    // Anthropic's Messages API takes the system prompt as a separate
    // top-level field rather than a message with role "system".
    const system = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');
    const conversation = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch(LLM.ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': LLM.ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        ...(system ? { system } : {}),
        messages: conversation,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic error ${response.status}: ${body}`);
    }

    const json = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };

    return json.content?.find((block) => block.type === 'text')?.text ?? '';
  }
}
