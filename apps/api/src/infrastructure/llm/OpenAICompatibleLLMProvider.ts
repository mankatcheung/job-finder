import type {
  ILLMProvider,
  LLMMessage,
  LLMToolDefinition,
  LLMCompletionResult,
  LLMToolCall,
  LLMStreamEvent,
} from '#src/use-cases/ports/ILLMProvider.js';
import { AUTH_HEADER, LLM } from '#src/constants.js';
import { fetchWithRetry } from '#src/infrastructure/llm/fetchWithRetry.js';
import { parseSSE } from '#src/infrastructure/llm/sseParser.js';

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

const OPENAI_STREAM_DONE = '[DONE]';

/**
 * One `chat.completion.chunk` object. `delta.tool_calls` entries are keyed
 * by `index` (supports parallel tool calls); `id`/`function.name` typically
 * arrive once on a call's first chunk and subsequent chunks for the same
 * index carry only `function.arguments` fragments to concatenate — but this
 * provider merges whichever fields are present per chunk rather than
 * assuming that ordering, which costs nothing and is robust either way.
 */
interface OpenAIStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string | null;
      tool_calls?: Array<{
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
  }>;
}

/**
 * Covers every provider that implements OpenAI's `/chat/completions` request
 * and response shape — OpenAI itself, OpenRouter, Mistral, Groq, xAI,
 * DeepSeek, and any user-supplied custom endpoint. Only the base URL and
 * default model differ between them, which the caller supplies.
 *
 * Unlike Anthropic (`AnthropicLLMProvider`), this provider sets no explicit
 * `cache_control` — OpenAI applies prompt caching automatically, no request
 * changes required, to any prompt >=1024 tokens whose prefix repeats
 * byte-for-byte across calls (OpenAI's own OpenAI-compatible-shaped
 * competitors that support caching, e.g. DeepSeek, work the same way).
 * `ChatWithAssistantUseCase` already builds messages with the stable part —
 * system prompt, then the user's `customAiPrompt` if set — first and the
 * per-turn conversation appended after, which is exactly the shape automatic
 * prefix caching needs (JEF-238). Nothing to wire here; the `tools` array
 * (also identical on every call, per `chatTools` in `http/di`) is static
 * too, so the whole cacheable block only grows as a conversation's history
 * grows, never shrinks or reorders.
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
    signal?: AbortSignal,
  ): Promise<string> {
    if (!this.apiKey) throw new Error('API key is not set');

    const json = await this.post(
      {
        model: this.model,
        messages: this.toWireMessages(messages),
        max_tokens: Math.min(maxTokens, LLM.MAX_OUTPUT_TOKENS_CAP),
      },
      signal,
    );

    return json.choices[0]?.message?.content ?? '';
  }

  async completeWithTools(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    maxTokens: number = LLM.DEFAULT_MAX_TOKENS,
    signal?: AbortSignal,
  ): Promise<LLMCompletionResult> {
    if (!this.apiKey) throw new Error('API key is not set');

    const json = await this.post(
      {
        model: this.model,
        messages: this.toWireMessages(messages),
        max_tokens: Math.min(maxTokens, LLM.MAX_OUTPUT_TOKENS_CAP),
        tools: tools.map((t) => ({
          type: 'function',
          function: { name: t.name, description: t.description, parameters: t.parameters },
        })),
      },
      signal,
    );

    const message = json.choices[0]?.message;
    const toolCalls: LLMToolCall[] = (message?.tool_calls ?? []).map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: this.parseArguments(tc.function.arguments),
    }));

    return { content: message?.content ?? null, toolCalls };
  }

  async *completeWithToolsStream(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    maxTokens: number = LLM.DEFAULT_MAX_TOKENS,
    signal?: AbortSignal,
  ): AsyncGenerator<LLMStreamEvent> {
    if (!this.apiKey) throw new Error('API key is not set');

    const body = await this.postStream(
      {
        model: this.model,
        messages: this.toWireMessages(messages),
        max_tokens: Math.min(maxTokens, LLM.MAX_OUTPUT_TOKENS_CAP),
        stream: true,
        tools: tools.map((t) => ({
          type: 'function',
          function: { name: t.name, description: t.description, parameters: t.parameters },
        })),
      },
      signal,
    );

    let content = '';
    const toolCalls = new Map<number, { id: string; name: string; arguments: string }>();

    for await (const frame of parseSSE(body)) {
      if (frame.data === OPENAI_STREAM_DONE) break;

      const chunk = JSON.parse(frame.data) as OpenAIStreamChunk;
      const delta = chunk.choices?.[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        content += delta.content;
        yield { type: 'text_delta', text: delta.content };
      }

      for (const tc of delta.tool_calls ?? []) {
        const existing = toolCalls.get(tc.index) ?? { id: '', name: '', arguments: '' };
        toolCalls.set(tc.index, {
          id: tc.id ?? existing.id,
          name: tc.function?.name ?? existing.name,
          arguments: existing.arguments + (tc.function?.arguments ?? ''),
        });
      }
    }

    yield {
      type: 'done',
      content: content || null,
      toolCalls: [...toolCalls.values()].map((tc) => ({
        id: tc.id,
        name: tc.name,
        arguments: this.parseArguments(tc.arguments),
      })),
    };
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

  private async post(
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<OpenAIWireResponse> {
    const response = await fetchWithRetry(
      this.baseUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${AUTH_HEADER.BEARER_PREFIX}${this.apiKey}`,
        },
        body: JSON.stringify(body),
      },
      signal,
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LLM provider error ${response.status}: ${text}`);
    }

    return response.json() as Promise<OpenAIWireResponse>;
  }

  private async postStream(
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<ReadableStream<Uint8Array>> {
    const response = await fetchWithRetry(
      this.baseUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${AUTH_HEADER.BEARER_PREFIX}${this.apiKey}`,
        },
        body: JSON.stringify(body),
      },
      signal,
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LLM provider error ${response.status}: ${text}`);
    }
    if (!response.body) throw new Error('LLM provider error: response had no body to stream');

    return response.body;
  }
}
