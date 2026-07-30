import type { ILLMProvider, LLMMessage } from '#src/use-cases/ports/ILLMProvider.js';
import { AUTH_HEADER } from '#src/constants.js';

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

  async complete(messages: LLMMessage[], maxTokens = 512): Promise<string> {
    if (!this.apiKey) throw new Error('API key is not set');

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${AUTH_HEADER.BEARER_PREFIX}${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, messages, max_tokens: maxTokens }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`LLM provider error ${response.status}: ${body}`);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    return json.choices[0]?.message?.content ?? '';
  }
}
