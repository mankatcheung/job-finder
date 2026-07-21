import type { ILLMProvider, LLMMessage } from '@/use-cases/ports/ILLMProvider.js';
import { AUTH_HEADER, ENV, LLM } from '@/constants.js';

export class OpenRouterLLMProvider implements ILLMProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env[ENV.OPENROUTER_API_KEY] ?? '';
    this.model = process.env[ENV.OPENROUTER_MODEL] ?? LLM.DEFAULT_MODEL;
  }

  async complete(messages: LLMMessage[], maxTokens = 512): Promise<string> {
    if (!this.apiKey) throw new Error(`${ENV.OPENROUTER_API_KEY} is not set`);

    const response = await fetch(LLM.API_URL, {
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
