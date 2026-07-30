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
  });
});
