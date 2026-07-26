import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenRouterLLMProvider } from '#src/infrastructure/llm/OpenRouterLLMProvider.js';
import { ENV, LLM } from '#src/constants.js';
import type { LLMMessage } from '#src/use-cases/ports/ILLMProvider.js';

const jsonResponse = (body: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(JSON.stringify(body)),
});

describe('OpenRouterLLMProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    delete process.env[ENV.OPENROUTER_API_KEY];
    delete process.env[ENV.OPENROUTER_MODEL];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('constructor', () => {
    it('falls back to the default model when OPENROUTER_MODEL is not set', async () => {
      process.env[ENV.OPENROUTER_API_KEY] = 'test-key';
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ choices: [{ message: { content: 'ok' } }] }) as never,
      );

      const provider = new OpenRouterLLMProvider();
      await provider.complete([{ role: 'user', content: 'hi' }]);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.model).toBe(LLM.OPENROUTER_DEFAULT_MODEL);
    });

    it('uses OPENROUTER_MODEL when set', async () => {
      process.env[ENV.OPENROUTER_API_KEY] = 'test-key';
      process.env[ENV.OPENROUTER_MODEL] = 'anthropic/claude-3-haiku';
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ choices: [{ message: { content: 'ok' } }] }) as never,
      );

      const provider = new OpenRouterLLMProvider();
      await provider.complete([{ role: 'user', content: 'hi' }]);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.model).toBe('anthropic/claude-3-haiku');
    });
  });

  describe('complete', () => {
    it('throws when OPENROUTER_API_KEY is not set', async () => {
      const provider = new OpenRouterLLMProvider();

      await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toThrow(
        `${ENV.OPENROUTER_API_KEY} is not set`,
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it('posts to the OpenRouter API URL with a Bearer auth header and the messages', async () => {
      process.env[ENV.OPENROUTER_API_KEY] = 'secret-key';
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ choices: [{ message: { content: 'ok' } }] }) as never,
      );

      const provider = new OpenRouterLLMProvider();
      const messages: LLMMessage[] = [
        { role: 'system', content: 'be helpful' },
        { role: 'user', content: 'hello' },
      ];
      await provider.complete(messages, 256);

      const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      expect(url).toBe(LLM.OPENROUTER_API_URL);
      expect((options.headers as Record<string, string>).Authorization).toBe('Bearer secret-key');

      const body = JSON.parse(options.body as string);
      expect(body.messages).toEqual(messages);
      expect(body.max_tokens).toBe(256);
    });

    it('defaults maxTokens to 512 when not provided', async () => {
      process.env[ENV.OPENROUTER_API_KEY] = 'secret-key';
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ choices: [{ message: { content: 'ok' } }] }) as never,
      );

      const provider = new OpenRouterLLMProvider();
      await provider.complete([{ role: 'user', content: 'hi' }]);

      const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.max_tokens).toBe(512);
    });

    it('returns the content of the first choice', async () => {
      process.env[ENV.OPENROUTER_API_KEY] = 'secret-key';
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ choices: [{ message: { content: 'generated response' } }] }) as never,
      );

      const provider = new OpenRouterLLMProvider();
      const result = await provider.complete([{ role: 'user', content: 'hi' }]);

      expect(result).toBe('generated response');
    });

    it('returns an empty string when choices are missing', async () => {
      process.env[ENV.OPENROUTER_API_KEY] = 'secret-key';
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ choices: [] }) as never);

      const provider = new OpenRouterLLMProvider();
      const result = await provider.complete([{ role: 'user', content: 'hi' }]);

      expect(result).toBe('');
    });

    it('throws with the status and body when the response is not ok', async () => {
      process.env[ENV.OPENROUTER_API_KEY] = 'secret-key';
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ error: 'rate limited' }, false, 429) as never,
      );

      const provider = new OpenRouterLLMProvider();

      await expect(provider.complete([{ role: 'user', content: 'hi' }])).rejects.toThrow(
        /OpenRouter error 429/,
      );
    });
  });
});
