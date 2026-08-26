import type {
  ILLMProvider,
  LLMMessage,
  LLMToolDefinition,
  LLMCompletionResult,
  LLMToolCall,
  LLMStreamEvent,
} from '#src/use-cases/ports/ILLMProvider.js';
import { LLM } from '#src/constants.js';
import { fetchWithRetry } from '#src/infrastructure/llm/fetchWithRetry.js';

interface GoogleAIPart {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface GoogleAIWireResponse {
  candidates?: Array<{ content?: { parts?: GoogleAIPart[] } }>;
}

/**
 * No prompt-caching wiring here, unlike `AnthropicLLMProvider`'s explicit
 * `cache_control` (JEF-238 investigation):
 *
 * - Gemini's *implicit* (automatic, no-code) caching only applies to Gemini
 *   2.5+ models — `LLM.GOOGLEAI_DEFAULT_MODEL` is `gemini-2.0-flash`, which
 *   isn't eligible at all regardless of anything this provider does.
 * - Even on a 2.5+ model, implicit caching needs a minimum prefix (2,048
 *   tokens for 2.5 Flash/Pro, 4,096 for newer Flash/Pro Preview tiers) — our
 *   system prompt plus the read-tool catalogue chat actually sends is only
 *   ~2,000–2,500 tokens by rough estimate, so it sits right at that floor
 *   even on 2.5, not comfortably above it.
 * - Gemini's *explicit* caching (a durable, named `CachedContents` resource,
 *   created/refreshed via a separate API call with its own TTL) would work
 *   regardless of model/size, but is a real feature to build — resource
 *   lifecycle, TTL refresh, a place to persist the resource name per
 *   provider/key — not a one-line `cache_control`-style flag.
 *
 * Net: nothing to change here today. If/when the default (or a user's
 * chosen) model moves to 2.5+, implicit caching applies automatically with
 * no code change, the same as OpenAI's — the lever is model choice, not this
 * provider.
 */
export class GoogleAILLMProvider implements ILLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = LLM.GOOGLEAI_DEFAULT_MODEL,
  ) {}

  async complete(
    messages: LLMMessage[],
    maxTokens: number = LLM.DEFAULT_MAX_TOKENS,
    signal?: AbortSignal,
  ): Promise<string> {
    if (!this.apiKey) throw new Error('Google AI API key is not set');

    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    }));

    const json = await this.post(
      {
        contents,
        generationConfig: { maxOutputTokens: Math.min(maxTokens, LLM.MAX_OUTPUT_TOKENS_CAP) },
      },
      signal,
    );

    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  async completeWithTools(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    maxTokens: number = LLM.DEFAULT_MAX_TOKENS,
    signal?: AbortSignal,
  ): Promise<LLMCompletionResult> {
    if (!this.apiKey) throw new Error('Google AI API key is not set');

    const systemInstruction = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');

    // Gemini's functionResponse is keyed by function name, not an opaque call
    // id — recover the name from the assistant message that requested it.
    const idToName = new Map<string, string>();
    for (const m of messages) {
      if (m.role === 'assistant' && m.toolCalls) {
        for (const tc of m.toolCalls) idToName.set(tc.id, tc.name);
      }
    }

    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => this.toWireContent(m, idToName));

    const json = await this.post(
      {
        contents,
        ...(systemInstruction
          ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
          : {}),
        tools: [
          {
            functionDeclarations: tools.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            })),
          },
        ],
        generationConfig: { maxOutputTokens: Math.min(maxTokens, LLM.MAX_OUTPUT_TOKENS_CAP) },
      },
      signal,
    );

    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const text = parts.find((p) => p.text !== undefined)?.text ?? null;
    const toolCalls: LLMToolCall[] = parts
      .filter((p): p is { functionCall: { name: string; args?: Record<string, unknown> } } =>
        Boolean(p.functionCall),
      )
      .map((p, i) => ({
        id: `${p.functionCall.name}-${i}`,
        name: p.functionCall.name,
        arguments: p.functionCall.args ?? {},
      }));

    return { content: text, toolCalls };
  }

  /**
   * Gemini stays on the non-streaming endpoint — JEF-239 only implements
   * genuine streaming for Anthropic and OpenAI-compatible providers.
   * Wrapping the existing call in the streaming shape keeps every provider
   * satisfying the same `ILLMProvider` interface, so `ChatWithAssistantUseCase`
   * doesn't need a runtime check for "does this provider actually stream" —
   * a Gemini-backed chat just renders its reply in one paint instead of
   * token-by-token, same as before this feature.
   */
  async *completeWithToolsStream(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    maxTokens: number = LLM.DEFAULT_MAX_TOKENS,
  ): AsyncGenerator<LLMStreamEvent> {
    const result = await this.completeWithTools(messages, tools, maxTokens);
    yield { type: 'done', ...result };
  }

  private toWireContent(
    m: LLMMessage,
    idToName: Map<string, string>,
  ): { role: string; parts: GoogleAIPart[] } {
    if (m.role === 'tool') {
      const name = idToName.get(m.toolCallId ?? '') ?? m.toolCallId ?? '';
      return {
        role: 'function',
        parts: [{ functionResponse: { name, response: { content: m.content } } }],
      };
    }
    if (m.role === 'assistant' && m.toolCalls?.length) {
      return {
        role: 'model',
        parts: m.toolCalls.map((tc) => ({ functionCall: { name: tc.name, args: tc.arguments } })),
      };
    }
    return { role: m.role === 'assistant' ? 'model' : m.role, parts: [{ text: m.content }] };
  }

  private async post(
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<GoogleAIWireResponse> {
    const url = `${LLM.GOOGLEAI_API_URL}/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      signal,
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google AI error ${response.status}: ${text}`);
    }

    return response.json() as Promise<GoogleAIWireResponse>;
  }
}
