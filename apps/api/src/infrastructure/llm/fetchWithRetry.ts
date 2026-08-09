import { LLM } from '#src/constants.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `fetch()` with a per-attempt timeout and a small bounded retry for
 * transient failures — network errors (including our own timeout) and 5xx
 * responses. A 4xx response (bad API key, bad request) is returned
 * immediately without retrying, so it fails fast and surfaces clearly
 * rather than being masked by a retry loop (JEF-110).
 *
 * Brings the three LLM providers in line with the `AbortSignal`/timeout
 * convention already used elsewhere for external fetches (e.g.
 * FetchJobPostingSourceResolver, IpLocationService) — previously none of
 * them had a timeout at all, so a hanging provider blocked indefinitely.
 *
 * Callers keep their own response-handling code unchanged: this only
 * decides whether to retry the transport-level call, then returns the
 * final `Response` (ok or not) or rethrows the final network error.
 */
export async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= LLM.MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(LLM.REQUEST_TIMEOUT_MS),
      });
      if (response.ok || response.status < 500 || attempt === LLM.MAX_RETRIES) {
        return response;
      }
      lastError = new Error(`Upstream returned ${response.status}`);
    } catch (err) {
      lastError = err;
      if (attempt === LLM.MAX_RETRIES) throw err;
    }
    await sleep(LLM.RETRY_BACKOFF_BASE_MS * 2 ** attempt);
  }

  // Unreachable: the loop above always returns or throws by the final
  // attempt. Present only so TypeScript can see every path returns.
  throw lastError;
}
