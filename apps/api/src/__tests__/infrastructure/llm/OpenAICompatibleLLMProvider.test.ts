import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAICompatibleLLMProvider } from '#src/infrastructure/llm/OpenAICompatibleLLMProvider.js';
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
});
