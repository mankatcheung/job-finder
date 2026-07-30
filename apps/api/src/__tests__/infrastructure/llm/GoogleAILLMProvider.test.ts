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
  });
});
