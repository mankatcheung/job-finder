import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FetchJobPostingSourceResolver } from '#src/infrastructure/jobDescription/FetchJobPostingSourceResolver.js';

describe('FetchJobPostingSourceResolver', () => {
  const resolver = new FetchJobPostingSourceResolver();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns trimmed text when text is provided', async () => {
    const result = await resolver.resolve({ text: '  Senior Engineer at Acme  ' });
    expect(result).toBe('Senior Engineer at Acme');
  });

  it('throws when neither text nor url is provided', async () => {
    await expect(resolver.resolve({})).rejects.toThrow('Either text or url must be provided');
  });

  it('throws when text is whitespace only', async () => {
    await expect(resolver.resolve({ text: '   ' })).rejects.toThrow(
      'Either text or url must be provided',
    );
  });

  it('fetches URL and strips HTML tags', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        '<html><body><p>Senior Engineer at Acme</p><script>alert("x")</script></body></html>',
    } as unknown as Response);

    const result = await resolver.resolve({ url: 'https://example.com/job' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/job',
      expect.objectContaining({
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobFinderBot/1.0)' },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(result).toBe('Senior Engineer at Acme');
  });

  it('throws when URL fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as unknown as Response);

    await expect(resolver.resolve({ url: 'https://example.com/missing' })).rejects.toThrow(
      'Failed to fetch URL: 404',
    );
  });

  it('decodes common HTML entities', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<p>Acme &amp; Co &lt;engineer&gt; &quot;remote&quot;</p>',
    } as unknown as Response);

    const result = await resolver.resolve({ url: 'https://example.com/job' });
    expect(result).toBe('Acme & Co <engineer> "remote"');
  });
});
