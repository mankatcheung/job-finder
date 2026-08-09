import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAICompatibleLLMProvider } from '#src/infrastructure/llm/OpenAICompatibleLLMProvider.js';
import { LLM } from '#src/constants.js';
import type { LLMMessage } from '#src/use-cases/ports/ILLMProvider.js';

const BASE_URL = 'https://api.example.com/v1/chat/completions';
const MODEL = 'example-model';

const jsonResponse = (body: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(JSON.stringify(body)),
});

describe('OpenAICompatibleLLMProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws when the API key is empty', async () => {
    const provider = new OpenAICompatibleLLMProvider('', BASE_URL, MODEL);

    await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      'API key is not set',
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('posts to the given base URL with a Bearer auth header, model, and messages', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: 'ok' } }] }) as never,
    );

    const provider = new OpenAICompatibleLLMProvider('secret-key', BASE_URL, MODEL);
    const messages: LLMMessage[] = [
      { role: 'system', content: 'be helpful' },
      { role: 'user', content: 'hello' },
    ];
    await provider.complete(messages, 256);

    const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe(BASE_URL);
    expect((options.headers as Record<string, string>).Authorization).toBe('Bearer secret-key');

    const body = JSON.parse(options.body as string);
    expect(body.model).toBe(MODEL);
    expect(body.messages).toEqual(messages);
    expect(body.max_tokens).toBe(256);
  });

  it('defaults maxTokens to 512 when not provided', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: 'ok' } }] }) as never,
    );

    const provider = new OpenAICompatibleLLMProvider('secret-key', BASE_URL, MODEL);
    await provider.complete([{ role: 'user', content: 'hi' }]);

    const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.max_tokens).toBe(512);
  });

  it('clamps a maxTokens request above the hard ceiling (JEF-126)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: 'ok' } }] }) as never,
    );

    const provider = new OpenAICompatibleLLMProvider('secret-key', BASE_URL, MODEL);
    await provider.complete([{ role: 'user', content: 'hi' }], 999_999);

    const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.max_tokens).toBe(LLM.MAX_OUTPUT_TOKENS_CAP);
  });

  it('returns the content of the first choice', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: 'generated response' } }] }) as never,
    );

    const provider = new OpenAICompatibleLLMProvider('secret-key', BASE_URL, MODEL);
    const result = await provider.complete([{ role: 'user', content: 'hi' }]);

    expect(result).toBe('generated response');
  });

  it('returns an empty string when choices are missing', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ choices: [] }) as never);

    const provider = new OpenAICompatibleLLMProvider('secret-key', BASE_URL, MODEL);
    const result = await provider.complete([{ role: 'user', content: 'hi' }]);

    expect(result).toBe('');
  });

  it('throws with the status and body when the response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: 'rate limited' }, false, 429) as never,
    );

    const provider = new OpenAICompatibleLLMProvider('secret-key', BASE_URL, MODEL);

    await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      /LLM provider error 429/,
    );
  });

  it('retries a transient 5xx failure and succeeds (JEF-110)', async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ error: 'unavailable' }, false, 503) as never)
        .mockResolvedValueOnce(
          jsonResponse({ choices: [{ message: { content: 'ok after retry' } }] }) as never,
        );

      const provider = new OpenAICompatibleLLMProvider('secret-key', BASE_URL, MODEL);
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

    const provider = new OpenAICompatibleLLMProvider('secret-key', BASE_URL, MODEL);

    await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      /LLM provider error 401/,
    );
    expect(fetch).toHaveBeenCalledTimes(1);
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
        jsonResponse({ choices: [{ message: { content: 'ok' } }] }) as never,
      );

      const provider = new OpenAICompatibleLLMProvider('secret-key', BASE_URL, MODEL);
      await provider.completeWithTools([{ role: 'user', content: 'hi' }], TOOLS, 999_999);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.max_tokens).toBe(LLM.MAX_OUTPUT_TOKENS_CAP);
    });

    it('sends tool definitions in the OpenAI function-calling shape', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ choices: [{ message: { content: 'ok' } }] }) as never,
      );

      const provider = new OpenAICompatibleLLMProvider('secret-key', BASE_URL, MODEL);
      await provider.completeWithTools([{ role: 'user', content: 'hi' }], TOOLS);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.tools).toEqual([
        {
          type: 'function',
          function: {
            name: 'list_applications',
            description: 'List applications',
            parameters: { type: 'object' },
          },
        },
      ]);
    });

    it('parses tool_calls from the response, including JSON-string arguments', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({
          choices: [
            {
              message: {
                content: null,
                tool_calls: [
                  {
                    id: 'call_1',
                    function: { name: 'list_applications', arguments: '{"status":"applied"}' },
                  },
                ],
              },
            },
          ],
        }) as never,
      );

      const provider = new OpenAICompatibleLLMProvider('secret-key', BASE_URL, MODEL);
      const result = await provider.completeWithTools([{ role: 'user', content: 'hi' }], TOOLS);

      expect(result).toEqual({
        content: null,
        toolCalls: [{ id: 'call_1', name: 'list_applications', arguments: { status: 'applied' } }],
      });
    });

    it('returns an empty toolCalls array and falls back to {} args when there are none / arguments are malformed', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        jsonResponse({ choices: [{ message: { content: 'plain answer' } }] }) as never,
      );
      const provider = new OpenAICompatibleLLMProvider('secret-key', BASE_URL, MODEL);
      const result = await provider.completeWithTools([{ role: 'user', content: 'hi' }], TOOLS);
      expect(result).toEqual({ content: 'plain answer', toolCalls: [] });

      vi.mocked(fetch).mockResolvedValueOnce(
        jsonResponse({
          choices: [
            {
              message: {
                content: null,
                tool_calls: [
                  { id: 'call_1', function: { name: 'list_applications', arguments: 'not json' } },
                ],
              },
            },
          ],
        }) as never,
      );
      const malformed = await provider.completeWithTools([{ role: 'user', content: 'hi' }], TOOLS);
      expect(malformed.toolCalls[0].arguments).toEqual({});
    });

    it('serializes an assistant tool-call request and a tool result message correctly', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ choices: [{ message: { content: 'final answer' } }] }) as never,
      );

      const provider = new OpenAICompatibleLLMProvider('secret-key', BASE_URL, MODEL);
      const messages: LLMMessage[] = [
        { role: 'user', content: 'which apps need follow up?' },
        {
          role: 'assistant',
          content: '',
          toolCalls: [
            { id: 'call_1', name: 'list_applications', arguments: { status: 'applied' } },
          ],
        },
        { role: 'tool', content: '[]', toolCallId: 'call_1' },
      ];
      await provider.completeWithTools(messages, TOOLS);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.messages[1]).toEqual({
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: { name: 'list_applications', arguments: '{"status":"applied"}' },
          },
        ],
      });
      expect(body.messages[2]).toEqual({ role: 'tool', tool_call_id: 'call_1', content: '[]' });
    });
  });
});
