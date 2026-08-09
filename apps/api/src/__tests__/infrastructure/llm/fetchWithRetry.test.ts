import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from '#src/infrastructure/llm/fetchWithRetry.js';
import { LLM } from '#src/constants.js';

const okResponse = (status = 200) => ({ ok: status < 400, status }) as Response;

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns the response on a successful first attempt', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse(200));

    const response = await fetchWithRetry('https://example.com', { method: 'POST' });

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('passes an AbortSignal for the per-attempt timeout', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse(200));

    await fetchWithRetry('https://example.com', { method: 'POST' });

    const [, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('preserves the caller-supplied init options alongside the signal', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse(200));

    await fetchWithRetry('https://example.com', {
      method: 'POST',
      headers: { 'x-api-key': 'secret' },
      body: '{"a":1}',
    });

    const [url, options] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.com');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'x-api-key': 'secret' });
    expect(options.body).toBe('{"a":1}');
  });

  it('returns a 4xx response immediately without retrying', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse(401));

    const response = await fetchWithRetry('https://example.com', {});

    expect(response.status).toBe(401);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries a 5xx response up to the configured limit, then returns the final failure', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse(503));

    const promise = fetchWithRetry('https://example.com', {});
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response.status).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(LLM.MAX_RETRIES + 1);
  });

  it('returns a successful response from a later retry after an initial 5xx', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okResponse(500)).mockResolvedValueOnce(okResponse(200));

    const promise = fetchWithRetry('https://example.com', {});
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('retries on a network error, then rethrows the last error once retries are exhausted', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('fetch failed'));

    const promise = fetchWithRetry('https://example.com', {});
    // Attach the rejection assertion before advancing timers, so the
    // rejection is never briefly unhandled between the two awaits.
    const assertion = expect(promise).rejects.toThrow('fetch failed');
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetch).toHaveBeenCalledTimes(LLM.MAX_RETRIES + 1);
  });

  it('recovers from a network error on a later retry', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(okResponse(200));

    const promise = fetchWithRetry('https://example.com', {});
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('waits with doubling backoff between retries', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse(500));

    const promise = fetchWithRetry('https://example.com', {});

    // First retry: nothing happens until the base backoff elapses.
    await vi.advanceTimersByTimeAsync(LLM.RETRY_BACKOFF_BASE_MS - 1);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(2);

    // Second retry: backoff doubles.
    await vi.advanceTimersByTimeAsync(LLM.RETRY_BACKOFF_BASE_MS * 2 - 1);
    expect(fetch).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetch).toHaveBeenCalledTimes(3);

    await promise;
  });
});
