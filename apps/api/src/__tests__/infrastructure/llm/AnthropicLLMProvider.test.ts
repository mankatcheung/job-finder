import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnthropicLLMProvider } from '#src/infrastructure/llm/AnthropicLLMProvider.js';
import { LLM } from '#src/constants.js';
import type { LLMMessage } from '#src/use-cases/ports/ILLMProvider.js';

const jsonResponse = (body: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(JSON.stringify(body)),
});

const streamResponse = (sseText: string, ok = true, status = 200) => ({
  ok,
  status,
  body: new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(sseText));
      controller.close();
    },
  }),
  text: () => Promise.resolve(sseText),
});

/**
 * Like `streamResponse`, but delivers each SSE frame `gapMs` apart instead
 * of all at once — for asserting streaming behavior over elapsed time (e.g.
 * the idle-timeout regression test) under `vi.useFakeTimers()`.
 */
const delayedStreamResponse = (frames: string[], gapMs: number, ok = true, status = 200) => {
  const encoder = new TextEncoder();
  let i = 0;
  return {
    ok,
    status,
    body: new ReadableStream<Uint8Array>({
      pull(controller) {
        if (i >= frames.length) {
          controller.close();
          return;
        }
        const frame = frames[i];
        i++;
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            controller.enqueue(encoder.encode(frame));
            resolve();
          }, gapMs);
        });
      },
    }),
    text: () => Promise.resolve(frames.join('')),
  };
};

async function collectStream(
  provider: AnthropicLLMProvider,
  ...args: Parameters<AnthropicLLMProvider['completeWithToolsStream']>
) {
  const events = [];
  for await (const event of provider.completeWithToolsStream(...args)) events.push(event);
  return events;
}

describe('AnthropicLLMProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('constructor', () => {
    it('falls back to the default model when none is given', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('test-key');
      await provider.complete([{ role: 'user', content: 'hi' }]);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.model).toBe(LLM.ANTHROPIC_DEFAULT_MODEL);
    });

    it('uses the given model when provided', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('test-key', 'claude-custom');
      await provider.complete([{ role: 'user', content: 'hi' }]);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.model).toBe('claude-custom');
    });
  });

  describe('complete', () => {
    it('throws when the API key is empty', async () => {
      const provider = new AnthropicLLMProvider('');

      await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toThrow(
        'Anthropic API key is not set',
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it('forwards a caller-supplied signal into the outbound fetch (JEF-240)', async () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));
      const controller = new AbortController();
      const provider = new AnthropicLLMProvider('secret-key');

      void provider.complete([{ role: 'user', content: 'hi' }], undefined, controller.signal);
      await Promise.resolve();

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(options.signal!.aborted).toBe(false);
      controller.abort();
      expect(options.signal!.aborted).toBe(true);
    });

    it('sends the API key and version as headers', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      await provider.complete([{ role: 'user', content: 'hi' }], 256);

      const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(LLM.ANTHROPIC_API_URL);
      const headers = options.headers as Record<string, string>;
      expect(headers['x-api-key']).toBe('secret-key');
      expect(headers['anthropic-version']).toBe(LLM.ANTHROPIC_VERSION);

      const body = JSON.parse(options.body as string);
      expect(body.max_tokens).toBe(256);
    });

    it('moves the system message to a top-level `system` field', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      const messages: LLMMessage[] = [
        { role: 'system', content: 'be helpful' },
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi there' },
      ];
      await provider.complete(messages);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.system).toBe('be helpful');
      expect(body.messages).toEqual([
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi there' },
      ]);
    });

    it('omits the `system` field when there is no system message', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      await provider.complete([{ role: 'user', content: 'hello' }]);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.system).toBeUndefined();
    });

    it('defaults maxTokens to 512 when not provided', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      await provider.complete([{ role: 'user', content: 'hi' }]);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.max_tokens).toBe(512);
    });

    it('clamps a maxTokens request above the hard ceiling (JEF-126)', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      await provider.complete([{ role: 'user', content: 'hi' }], 999_999);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.max_tokens).toBe(LLM.MAX_OUTPUT_TOKENS_CAP);
    });

    it('leaves an under-ceiling maxTokens request unchanged', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      await provider.complete([{ role: 'user', content: 'hi' }], 1024);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.max_tokens).toBe(1024);
    });

    it('returns the text of the first text content block', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'generated response' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      const result = await provider.complete([{ role: 'user', content: 'hi' }]);

      expect(result).toBe('generated response');
    });

    it('returns an empty string when there is no text content block', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ content: [] }) as never);

      const provider = new AnthropicLLMProvider('secret-key');
      const result = await provider.complete([{ role: 'user', content: 'hi' }]);

      expect(result).toBe('');
    });

    it('throws with the status and body when the response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ error: 'rate limited' }, false, 429) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');

      await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toThrow(
        /Anthropic error 429/,
      );
    });

    it('retries a transient 5xx failure and succeeds (JEF-110)', async () => {
      vi.useFakeTimers();
      try {
        vi.mocked(fetch)
          .mockResolvedValueOnce(jsonResponse({ error: 'unavailable' }, false, 503) as never)
          .mockResolvedValueOnce(
            jsonResponse({ content: [{ type: 'text', text: 'ok after retry' }] }) as never,
          );

        const provider = new AnthropicLLMProvider('secret-key');
        const promise = provider.complete([{ role: 'user', content: 'hi' }]);
        await vi.runAllTimersAsync();
        const result = await promise;

        expect(result).toBe('ok after retry');
        expect(fetch).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('does not retry a 4xx failure', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: 'bad key' }, false, 401) as never);

      const provider = new AnthropicLLMProvider('secret-key');

      await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toThrow(
        /Anthropic error 401/,
      );
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('completeWithTools', () => {
    const TOOLS = [
      {
        name: 'list_applications',
        description: 'List applications',
        parameters: { type: 'object' },
      },
    ];

    it('clamps a maxTokens request above the hard ceiling (JEF-126)', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      await provider.completeWithTools([{ role: 'user', content: 'hi' }], TOOLS, 999_999);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.max_tokens).toBe(LLM.MAX_OUTPUT_TOKENS_CAP);
    });

    it('sends tool definitions in the Anthropic input_schema shape', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      await provider.completeWithTools([{ role: 'user', content: 'hi' }], TOOLS);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.tools).toEqual([
        {
          name: 'list_applications',
          description: 'List applications',
          input_schema: { type: 'object' },
        },
      ]);
    });

    it('attaches cache_control only to tools marked cacheBreakpoint', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      const tools = [
        { name: 'list_applications', description: 'List applications', parameters: {} },
        {
          name: 'get_application',
          description: 'Get an application',
          parameters: {},
          cacheBreakpoint: true,
        },
      ];
      await provider.completeWithTools([{ role: 'user', content: 'hi' }], tools);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.tools[0].cache_control).toBeUndefined();
      expect(body.tools[1].cache_control).toEqual({ type: 'ephemeral' });
    });

    it('parses tool_use blocks from the response alongside any text block', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({
          content: [
            { type: 'text', text: "I'll check that." },
            {
              type: 'tool_use',
              id: 'toolu_1',
              name: 'list_applications',
              input: { status: 'applied' },
            },
          ],
        }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      const result = await provider.completeWithTools([{ role: 'user', content: 'hi' }], TOOLS);

      expect(result).toEqual({
        content: "I'll check that.",
        toolCalls: [{ id: 'toolu_1', name: 'list_applications', arguments: { status: 'applied' } }],
      });
    });

    it('returns an empty toolCalls array when the response has only text', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'plain answer' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      const result = await provider.completeWithTools([{ role: 'user', content: 'hi' }], TOOLS);

      expect(result).toEqual({ content: 'plain answer', toolCalls: [] });
    });

    it('serializes an assistant tool-call request as a tool_use block and a tool result as a user tool_result block', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'done' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      const messages: LLMMessage[] = [
        { role: 'user', content: 'which apps need follow up?' },
        {
          role: 'assistant',
          content: '',
          toolCalls: [
            { id: 'toolu_1', name: 'list_applications', arguments: { status: 'applied' } },
          ],
        },
        { role: 'tool', content: '[]', toolCallId: 'toolu_1' },
      ];
      await provider.completeWithTools(messages, TOOLS);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.messages[1]).toEqual({
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'toolu_1',
            name: 'list_applications',
            input: { status: 'applied' },
          },
        ],
      });
      expect(body.messages[2]).toEqual({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: '[]' }],
      });
    });
  });

  describe('prompt caching', () => {
    it('keeps the bare-string system field when no system message is marked cacheBreakpoint', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      await provider.complete([
        { role: 'system', content: 'be helpful' },
        { role: 'user', content: 'hi' },
      ]);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.system).toBe('be helpful');
    });

    it('switches to a content-block system field, attaching cache_control only to the marked block', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      await provider.complete([
        { role: 'system', content: 'shared system prompt', cacheBreakpoint: true },
        { role: 'system', content: 'per-user custom prompt' },
        { role: 'user', content: 'hi' },
      ]);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.system).toEqual([
        {
          type: 'text',
          text: 'shared system prompt',
          cache_control: { type: 'ephemeral' },
        },
        { type: 'text', text: 'per-user custom prompt' },
      ]);
    });

    it('applies the same system cache_control behavior to completeWithTools', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ content: [{ type: 'text', text: 'ok' }] }) as never,
      );

      const provider = new AnthropicLLMProvider('secret-key');
      await provider.completeWithTools(
        [{ role: 'system', content: 'shared system prompt', cacheBreakpoint: true }],
        [],
      );

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.system).toEqual([
        {
          type: 'text',
          text: 'shared system prompt',
          cache_control: { type: 'ephemeral' },
        },
      ]);
    });
  });

  describe('completeWithToolsStream (JEF-239)', () => {
    it('throws when the API key is empty', async () => {
      const provider = new AnthropicLLMProvider('');

      await expect(collectStream(provider, [{ role: 'user', content: 'hi' }], [])).rejects.toThrow(
        'Anthropic API key is not set',
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it('sends stream: true in the request body', async () => {
      vi.mocked(fetch).mockResolvedValue(
        streamResponse('event: message_stop\ndata: {"type":"message_stop"}\n\n') as never,
      );
      const provider = new AnthropicLLMProvider('secret-key');

      await collectStream(provider, [{ role: 'user', content: 'hi' }], []);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.stream).toBe(true);
    });

    it('forwards a caller-supplied signal into the outbound fetch', async () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));
      const controller = new AbortController();
      const provider = new AnthropicLLMProvider('secret-key');

      const gen = provider.completeWithToolsStream(
        [{ role: 'user', content: 'hi' }],
        [],
        undefined,
        controller.signal,
      );
      void gen.next();
      await Promise.resolve();

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(options.signal!.aborted).toBe(false);
      controller.abort();
      expect(options.signal!.aborted).toBe(true);
    });

    it('yields a text_delta per content_block_delta and a final done with the joined text', async () => {
      const sse = [
        'event: message_start',
        'data: {"type":"message_start"}',
        '',
        'event: content_block_start',
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"text"}}',
        '',
        'event: ping',
        'data: {"type":"ping"}',
        '',
        'event: content_block_delta',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}',
        '',
        'event: content_block_delta',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" world"}}',
        '',
        'event: content_block_stop',
        'data: {"type":"content_block_stop","index":0}',
        '',
        'event: message_stop',
        'data: {"type":"message_stop"}',
        '',
        '',
      ].join('\n');
      vi.mocked(fetch).mockResolvedValue(streamResponse(sse) as never);
      const provider = new AnthropicLLMProvider('secret-key');

      const events = await collectStream(provider, [{ role: 'user', content: 'hi' }], []);

      expect(events).toEqual([
        { type: 'text_delta', text: 'Hello' },
        { type: 'text_delta', text: ' world' },
        { type: 'done', content: 'Hello world', toolCalls: [] },
      ]);
    });

    it('completes a stream that runs well past REQUEST_TIMEOUT_MS in total, as long as chunks keep arriving within the idle window (regression)', async () => {
      vi.useFakeTimers();
      try {
        const frames = [
          'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text"}}\n\n',
          'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"a"}}\n\n',
          'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"b"}}\n\n',
          'event: message_stop\ndata: {"type":"message_stop"}\n\n',
        ];
        // Spaced well under LLM.STREAM_IDLE_TIMEOUT_MS apart, but their sum
        // comfortably exceeds LLM.REQUEST_TIMEOUT_MS — the old fixed-duration
        // timeout (tied to the whole fetch, including the body read) would
        // have aborted this mid-stream even though it was actively flowing.
        const gapMs = LLM.STREAM_IDLE_TIMEOUT_MS - 5_000;
        vi.mocked(fetch).mockResolvedValue(delayedStreamResponse(frames, gapMs) as never);
        const provider = new AnthropicLLMProvider('secret-key');

        const events: unknown[] = [];
        const consume = (async () => {
          for await (const event of provider.completeWithToolsStream(
            [{ role: 'user', content: 'hi' }],
            [],
          )) {
            events.push(event);
          }
        })();

        for (let i = 0; i < frames.length; i++) {
          await vi.advanceTimersByTimeAsync(gapMs);
        }
        await consume;

        expect(events).toEqual([
          { type: 'text_delta', text: 'a' },
          { type: 'text_delta', text: 'b' },
          { type: 'done', content: 'ab', toolCalls: [] },
        ]);
      } finally {
        vi.useRealTimers();
      }
    });

    it('reassembles a streamed tool call from input_json_delta fragments', async () => {
      const sse = [
        'event: content_block_start',
        'data: {"type":"content_block_start","index":0,"content_block":{"type":"tool_use","id":"toolu_1","name":"list_applications"}}',
        '',
        'event: content_block_delta',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"{\\"status\\":"}}',
        '',
        'event: content_block_delta',
        'data: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":"\\"applied\\"}"}}',
        '',
        'event: content_block_stop',
        'data: {"type":"content_block_stop","index":0}',
        '',
        'event: message_stop',
        'data: {"type":"message_stop"}',
        '',
        '',
      ].join('\n');
      vi.mocked(fetch).mockResolvedValue(streamResponse(sse) as never);
      const provider = new AnthropicLLMProvider('secret-key');

      const events = await collectStream(provider, [{ role: 'user', content: 'hi' }], []);

      expect(events).toEqual([
        {
          type: 'done',
          content: null,
          toolCalls: [
            { id: 'toolu_1', name: 'list_applications', arguments: { status: 'applied' } },
          ],
        },
      ]);
    });

    it('throws on a stream error event', async () => {
      const sse =
        'event: error\ndata: {"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}\n\n';
      vi.mocked(fetch).mockResolvedValue(streamResponse(sse) as never);
      const provider = new AnthropicLLMProvider('secret-key');

      await expect(collectStream(provider, [{ role: 'user', content: 'hi' }], [])).rejects.toThrow(
        /Overloaded/,
      );
    });

    it('throws when the response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue(streamResponse('rate limited', false, 429) as never);
      const provider = new AnthropicLLMProvider('secret-key');

      await expect(collectStream(provider, [{ role: 'user', content: 'hi' }], [])).rejects.toThrow(
        /Anthropic error 429/,
      );
    });
  });
});
