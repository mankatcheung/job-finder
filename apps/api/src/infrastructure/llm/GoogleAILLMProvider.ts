import type { ILLMProvider, LLMMessage } from '#src/use-cases/ports/ILLMProvider.js';
import { LLM } from '#src/constants.js';

export class GoogleAILLMProvider implements ILLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = LLM.GOOGLEAI_DEFAULT_MODEL,
  ) {}

  async complete(messages: LLMMessage[], maxTokens = 512): Promise<string> {
    if (!this.apiKey) throw new Error('Google AI API key is not set');

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    }));

    const url = `${LLM.GOOGLEAI_API_URL}/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Google AI error ${response.status}: ${body}`);
    }

    const json = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text: string }> } }>;
    };

    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
}
