import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleAILLMProvider } from '#src/infrastructure/llm/GoogleAILLMProvider.js';
import { LLM } from '#src/constants.js';
import type { LLMMessage } from '#src/use-cases/ports/ILLMProvider.js';

const jsonResponse = (body: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(JSON.stringify(body)),
});

describe('GoogleAILLMProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('constructor', () => {
    it('falls back to the default model when none is given', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }) as never,
      );

      const provider = new GoogleAILLMProvider('test-key');
      await provider.complete([{ role: 'user', content: 'hi' }]);

      const [url] = vi.mocked(fetch).mock.calls[0] as [string];
      expect(url).toContain(`/${LLM.GOOGLEAI_DEFAULT_MODEL}:generateContent`);
    });

    it('uses the given model when provided', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }) as never,
      );

      const provider = new GoogleAILLMProvider('test-key', 'gemini-custom');
      await provider.complete([{ role: 'user', content: 'hi' }]);

      const [url] = vi.mocked(fetch).mock.calls[0] as [string];
      expect(url).toContain('/gemini-custom:generateContent');
    });
  });

  describe('complete', () => {
    it('throws when the API key is empty', async () => {
      const provider = new GoogleAILLMProvider('');

      await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toThrow(
        'Google AI API key is not set',
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it('sends the API key as a query param and the messages as contents', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }) as never,
      );

      const provider = new GoogleAILLMProvider('secret-key');
      const messages: LLMMessage[] = [
        { role: 'system', content: 'be helpful' },
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi there' },
      ];
      await provider.complete(messages, 256);

      const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toContain('key=secret-key');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body as string);
      expect(body.generationConfig).toEqual({ maxOutputTokens: 256 });
      expect(body.contents).toEqual([
        { role: 'system', parts: [{ text: 'be helpful' }] },
        { role: 'user', parts: [{ text: 'hello' }] },
        { role: 'model', parts: [{ text: 'hi there' }] },
      ]);
    });

    it('defaults maxTokens to 512 when not provided', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }) as never,
      );

      const provider = new GoogleAILLMProvider('secret-key');
      await provider.complete([{ role: 'user', content: 'hi' }]);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.generationConfig).toEqual({ maxOutputTokens: 512 });
    });

    it('clamps a maxTokens request above the hard ceiling (JEF-126)', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }) as never,
      );

      const provider = new GoogleAILLMProvider('secret-key');
      await provider.complete([{ role: 'user', content: 'hi' }], 999_999);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.generationConfig).toEqual({ maxOutputTokens: LLM.MAX_OUTPUT_TOKENS_CAP });
    });

    it('returns the text from the first candidate', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({
          candidates: [{ content: { parts: [{ text: 'generated response' }] } }],
        }) as never,
      );

      const provider = new GoogleAILLMProvider('secret-key');
      const result = await provider.complete([{ role: 'user', content: 'hi' }]);

      expect(result).toBe('generated response');
    });

    it('returns an empty string when candidates are missing', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({}) as never);

      const provider = new GoogleAILLMProvider('secret-key');
      const result = await provider.complete([{ role: 'user', content: 'hi' }]);

      expect(result).toBe('');
    });

    it('throws with the status and body when the response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ error: 'quota exceeded' }, false, 429) as never,
      );

      const provider = new GoogleAILLMProvider('secret-key');

      await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toThrow(
        /Google AI error 429/,
      );
    });

    it('retries a transient 5xx failure and succeeds (JEF-110)', async () => {
      vi.useFakeTimers();
      try {
        vi.mocked(fetch)
          .mockResolvedValueOnce(jsonResponse({ error: 'unavailable' }, false, 503) as never)
          .mockResolvedValueOnce(
            jsonResponse({
              candidates: [{ content: { parts: [{ text: 'ok after retry' }] } }],
            }) as never,
          );

        const provider = new GoogleAILLMProvider('secret-key');
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

      const provider = new GoogleAILLMProvider('secret-key');

      await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toThrow(
        /Google AI error 401/,
      );
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('forwards a caller-supplied signal into the outbound fetch (JEF-240)', async () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));
      const controller = new AbortController();
      const provider = new GoogleAILLMProvider('secret-key');

      void provider.complete([{ role: 'user', content: 'hi' }], undefined, controller.signal);
      await Promise.resolve();

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(options.signal!.aborted).toBe(false);
      controller.abort();
      expect(options.signal!.aborted).toBe(true);
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
        jsonResponse({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }) as never,
      );

      const provider = new GoogleAILLMProvider('secret-key');
      await provider.completeWithTools([{ role: 'user', content: 'hi' }], TOOLS, 999_999);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.generationConfig).toEqual({ maxOutputTokens: LLM.MAX_OUTPUT_TOKENS_CAP });
    });

    it('sends tool definitions in the Gemini functionDeclarations shape', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }) as never,
      );

      const provider = new GoogleAILLMProvider('secret-key');
      await provider.completeWithTools([{ role: 'user', content: 'hi' }], TOOLS);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.tools).toEqual([
        {
          functionDeclarations: [
            {
              name: 'list_applications',
              description: 'List applications',
              parameters: { type: 'object' },
            },
          ],
        },
      ]);
    });

    it('moves the system message to a top-level systemInstruction field', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }) as never,
      );

      const provider = new GoogleAILLMProvider('secret-key');
      await provider.completeWithTools(
        [
          { role: 'system', content: 'be helpful' },
          { role: 'user', content: 'hello' },
        ],
        TOOLS,
      );

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.systemInstruction).toEqual({ parts: [{ text: 'be helpful' }] });
      expect(body.contents).toEqual([{ role: 'user', parts: [{ text: 'hello' }] }]);
    });

    it('parses a functionCall part from the response', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({
          candidates: [
            {
              content: {
                parts: [
                  { functionCall: { name: 'list_applications', args: { status: 'applied' } } },
                ],
              },
            },
          ],
        }) as never,
      );

      const provider = new GoogleAILLMProvider('secret-key');
      const result = await provider.completeWithTools([{ role: 'user', content: 'hi' }], TOOLS);

      expect(result.content).toBeNull();
      expect(result.toolCalls).toEqual([
        { id: 'list_applications-0', name: 'list_applications', arguments: { status: 'applied' } },
      ]);
    });

    it('returns an empty toolCalls array when the response has only text', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ candidates: [{ content: { parts: [{ text: 'plain answer' }] } }] }) as never,
      );

      const provider = new GoogleAILLMProvider('secret-key');
      const result = await provider.completeWithTools([{ role: 'user', content: 'hi' }], TOOLS);

      expect(result).toEqual({ content: 'plain answer', toolCalls: [] });
    });

    it('serializes an assistant tool-call request as a model functionCall part and a tool result by function name', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ candidates: [{ content: { parts: [{ text: 'done' }] } }] }) as never,
      );

      const provider = new GoogleAILLMProvider('secret-key');
      const messages: LLMMessage[] = [
        { role: 'user', content: 'which apps need follow up?' },
        {
          role: 'assistant',
          content: '',
          toolCalls: [
            {
              id: 'list_applications-0',
              name: 'list_applications',
              arguments: { status: 'applied' },
            },
          ],
        },
        { role: 'tool', content: '[]', toolCallId: 'list_applications-0' },
      ];
      await provider.completeWithTools(messages, TOOLS);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.contents[1]).toEqual({
        role: 'model',
        parts: [{ functionCall: { name: 'list_applications', args: { status: 'applied' } } }],
      });
      expect(body.contents[2]).toEqual({
        role: 'function',
        parts: [{ functionResponse: { name: 'list_applications', response: { content: '[]' } } }],
      });
    });
  });
});
