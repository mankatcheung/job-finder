import type {
  ILLMProvider,
  LLMMessage,
  LLMToolDefinition,
  LLMToolCall,
  LLMStreamEvent,
  LLMCompleteResult,
  LLMUsage,
} from '#src/use-cases/ports/ILLMProvider.js';
import { LLM } from '#src/use-cases/constants.js';
import {
  fetchWithRetry,
  createIdleAbortController,
} from '#src/infrastructure/llm/fetchWithRetry.js';
import { parseSSE } from '#src/infrastructure/llm/sseParser.js';

type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };

type AnthropicCacheControl = { type: 'ephemeral' };

type AnthropicSystemBlock = { type: 'text'; text: string; cache_control?: AnthropicCacheControl };

interface AnthropicWireMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
}

interface AnthropicWireUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

interface AnthropicWireResponse {
  content?: AnthropicContentBlock[];
  usage?: AnthropicWireUsage;
}

function toLLMUsage(usage: AnthropicWireUsage | undefined): LLMUsage | null {
  if (!usage) return null;
  return {
    promptTokens:
      usage.input_tokens +
      (usage.cache_creation_input_tokens ?? 0) +
      (usage.cache_read_input_tokens ?? 0),
    completionTokens: usage.output_tokens,
  };
}

/**
 * The subset of Anthropic's streaming event fields this provider acts on —
 * see https://platform.claude.com/docs/en/build-with-claude/streaming. A
 * flat, all-optional shape rather than a discriminated union: every field
 * this provider doesn't recognize (message_start's `message`, ping, etc.)
 * is simply absent rather than needing its own variant, matching the same
 * loosely-typed-wire-response convention as `AnthropicWireResponse` above.
 */
interface AnthropicStreamEvent {
  type: string;
  index?: number;
  content_block?: { type: 'text' } | { type: 'tool_use'; id: string; name: string };
  delta?: { type: 'text_delta'; text: string } | { type: 'input_json_delta'; partial_json: string };
  error?: { type: string; message: string };
  /** Present on `message_start` — initial usage, output_tokens still a placeholder. */
  message?: { usage?: AnthropicWireUsage };
  /** Present on `message_delta` — the final, cumulative output_tokens count. */
  usage?: { output_tokens: number };
}

export class AnthropicLLMProvider implements ILLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = LLM.ANTHROPIC_DEFAULT_MODEL,
  ) {}

  async complete(
    messages: LLMMessage[],
    maxTokens: number = LLM.DEFAULT_MAX_TOKENS,
    signal?: AbortSignal,
  ): Promise<LLMCompleteResult> {
    if (!this.apiKey) throw new Error('Anthropic API key is not set');

    const { system, conversation } = this.splitSystem(messages);
    const json = await this.post(
      {
        model: this.model,
        max_tokens: Math.min(maxTokens, LLM.MAX_OUTPUT_TOKENS_CAP),
        ...(system ? { system } : {}),
        messages: conversation.map((m) => ({ role: m.role, content: m.content })),
      },
      signal,
    );

    return {
      content: json.content?.find((block) => block.type === 'text')?.text ?? '',
      usage: toLLMUsage(json.usage),
    };
  }

  async *completeWithToolsStream(
    messages: LLMMessage[],
    tools: LLMToolDefinition[],
    maxTokens: number = LLM.DEFAULT_MAX_TOKENS,
    signal?: AbortSignal,
  ): AsyncGenerator<LLMStreamEvent> {
    if (!this.apiKey) throw new Error('Anthropic API key is not set');

    const { system, conversation } = this.splitSystem(messages);
    const { body, onChunk, dispose } = await this.postStream(
      {
        model: this.model,
        max_tokens: Math.min(maxTokens, LLM.MAX_OUTPUT_TOKENS_CAP),
        stream: true,
        ...(system ? { system } : {}),
        messages: this.toWireMessages(conversation),
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters,
          ...(t.cacheBreakpoint ? { cache_control: { type: 'ephemeral' as const } } : {}),
        })),
      },
      signal,
    );

    // Content blocks arrive by index — text and tool_use can interleave in
    // principle, so each index accumulates independently rather than
    // assuming a single running block. Tool call arguments stream as raw
    // partial JSON string fragments (`input_json_delta`): Anthropic's own
    // docs say to concatenate the whole string and parse once at
    // content_block_stop rather than parsing incrementally.
    const blocks = new Map<
      number,
      { type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; json: string }
    >();
    // See toLLMUsage: input tokens (incl. cache) arrive once on message_start;
    // the final, cumulative output token count arrives once on message_delta.
    let promptTokens: number | null = null;
    let completionTokens: number | null = null;

    try {
      for await (const frame of parseSSE(body, onChunk)) {
        const event = JSON.parse(frame.data) as AnthropicStreamEvent;

        switch (event.type) {
          case 'message_start': {
            const usage = toLLMUsage(event.message?.usage);
            if (usage) promptTokens = usage.promptTokens;
            break;
          }
          case 'message_delta': {
            if (event.usage) completionTokens = event.usage.output_tokens;
            break;
          }
          case 'content_block_start': {
            if (event.index === undefined || !event.content_block) break;
            const cb = event.content_block;
            blocks.set(
              event.index,
              cb.type === 'text'
                ? { type: 'text', text: '' }
                : { type: 'tool_use', id: cb.id, name: cb.name, json: '' },
            );
            break;
          }
          case 'content_block_delta': {
            if (event.index === undefined || !event.delta) break;
            const block = blocks.get(event.index);
            const delta = event.delta;
            if (!block) break;
            if (delta.type === 'text_delta' && block.type === 'text') {
              block.text += delta.text;
              yield { type: 'text_delta', text: delta.text };
            } else if (delta.type === 'input_json_delta' && block.type === 'tool_use') {
              block.json += delta.partial_json;
            }
            break;
          }
          case 'error':
            throw new Error(`Anthropic stream error: ${event.error?.message ?? 'unknown error'}`);
          default:
            // content_block_stop/message_stop/ping carry nothing this loop
            // needs beyond what's already tracked, and future event types the
            // docs say may be added should be ignored rather than treated as
            // an error.
            break;
        }
      }
    } finally {
      dispose();
    }

    let text: string | null = null;
    const toolCalls: LLMToolCall[] = [];
    for (const block of blocks.values()) {
      if (block.type === 'text') {
        text = block.text;
      } else {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: this.parseArguments(block.json),
        });
      }
    }

    const usage =
      promptTokens !== null && completionTokens !== null
        ? { promptTokens, completionTokens }
        : null;
    yield { type: 'done', content: text, toolCalls, usage };
  }

  private parseArguments(raw: string): Record<string, unknown> {
    try {
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  private splitSystem(messages: LLMMessage[]): {
    system: string | AnthropicSystemBlock[];
    conversation: LLMMessage[];
  } {
    // Anthropic's Messages API takes the system prompt as a separate
    // top-level field rather than a message with role "system".
    const systemMessages = messages.filter((m) => m.role === 'system');
    const conversation = messages.filter((m) => m.role !== 'system');

    // Only switch to the content-block form when a cache breakpoint is
    // actually in use — keeps the existing bare-string wire shape unchanged
    // for every caller that doesn't request caching.
    const system = systemMessages.some((m) => m.cacheBreakpoint)
      ? systemMessages.map((m) => ({
          type: 'text' as const,
          text: m.content,
          ...(m.cacheBreakpoint ? { cache_control: { type: 'ephemeral' as const } } : {}),
        }))
      : systemMessages.map((m) => m.content).join('\n\n');

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

  private async post(
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<AnthropicWireResponse> {
    const response = await fetchWithRetry(
      LLM.ANTHROPIC_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': LLM.ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
      },
      signal,
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic error ${response.status}: ${text}`);
    }

    return response.json() as Promise<AnthropicWireResponse>;
  }

  private async postStream(
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<{ body: ReadableStream<Uint8Array>; onChunk: () => void; dispose: () => void }> {
    // See `createIdleAbortController`'s doc comment: a streaming reply can
    // legitimately run well past a normal request's timeout as long as bytes
    // keep arriving, so this resets on every chunk instead of capping total
    // duration.
    const idle = createIdleAbortController(LLM.STREAM_IDLE_TIMEOUT_MS, signal);
    const response = await fetchWithRetry(
      LLM.ANTHROPIC_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': LLM.ANTHROPIC_VERSION,
        },
        body: JSON.stringify(body),
      },
      idle.signal,
      null,
    );

    if (!response.ok) {
      idle.dispose();
      const text = await response.text();
      throw new Error(`Anthropic error ${response.status}: ${text}`);
    }
    if (!response.body) {
      idle.dispose();
      throw new Error('Anthropic error: response had no body to stream');
    }

    return { body: response.body, onChunk: idle.activity, dispose: idle.dispose };
  }
}
