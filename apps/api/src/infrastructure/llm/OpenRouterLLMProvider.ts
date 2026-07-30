import type { ILLMProvider, LLMMessage } from '#src/use-cases/ports/ILLMProvider.js';
import { AUTH_HEADER, LLM } from '#src/constants.js';

export class OpenRouterLLMProvider implements ILLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = LLM.OPENROUTER_DEFAULT_MODEL,
  ) {}

  async complete(messages: LLMMessage[], maxTokens = 512): Promise<string> {
    if (!this.apiKey) throw new Error('OpenRouter API key is not set');

    const response = await fetch(LLM.OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${AUTH_HEADER.BEARER_PREFIX}${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, messages, max_tokens: maxTokens }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${body}`);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    return json.choices[0]?.message?.content ?? '';
  }
}
