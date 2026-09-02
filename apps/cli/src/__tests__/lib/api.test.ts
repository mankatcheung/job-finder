import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gql, AuthError, ApiError } from '../../lib/api.js';

const API_URL = 'http://api.test/graphql';

vi.mock('../../lib/config.js', () => ({
  getApiKey: vi.fn(() => 'trakwyn_test_key'),
  getApiUrl: vi.fn(() => API_URL),
}));

const { getApiKey } = await import('../../lib/config.js');

/** A real `Response`, so `json()` parses (and rejects) exactly as it will in production. */
function respond(body: string, status = 200): Response {
  return new Response(body, { status });
}

function respondJson(body: unknown, status = 200): Response {
  return respond(JSON.stringify(body), status);
}

const fetchMock = vi.fn<typeof fetch>();

describe('gql', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getApiKey).mockReturnValue('trakwyn_test_key');
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the data payload for a successful envelope', async () => {
    fetchMock.mockResolvedValue(respondJson({ data: { applications: [{ id: 'a1' }] } }));

    const data = await gql<{ applications: Array<{ id: string }> }>(
      'query { applications { id } }',
    );

    expect(data.applications).toEqual([{ id: 'a1' }]);
  });

  it('sends the API key as a bearer token', async () => {
    fetchMock.mockResolvedValue(respondJson({ data: {} }));

    await gql('query { me { id } }');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(API_URL);
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer trakwyn_test_key');
  });

  it('throws AuthError without calling the API when no key is configured', async () => {
    vi.mocked(getApiKey).mockReturnValue(null);

    await expect(gql('query { me { id } }')).rejects.toBeInstanceOf(AuthError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws AuthError when the API answers UNAUTHORIZED', async () => {
    fetchMock.mockResolvedValue(
      respondJson({
        errors: [{ message: 'Not authenticated', extensions: { code: 'UNAUTHORIZED' } }],
      }),
    );

    await expect(gql('query { me { id } }')).rejects.toBeInstanceOf(AuthError);
  });

  it('surfaces any other GraphQL error message as an ApiError', async () => {
    fetchMock.mockResolvedValue(
      respondJson({
        errors: [{ message: 'Application not found', extensions: { code: 'NOT_FOUND' } }],
      }),
    );

    await expect(gql('query { application { id } }')).rejects.toThrow(
      new ApiError('Application not found'),
    );
  });

  // ── the guard ─────────────────────────────────────────────────────────────
  // Each of these used to satisfy `as { data?: …; errors?: … }` and reach the
  // command layer as `{}`, where the first property access threw a TypeError
  // naming neither the endpoint nor what went wrong.

  it('rejects valid JSON that is not a GraphQL envelope, naming the URL and status', async () => {
    fetchMock.mockResolvedValue(respondJson({ message: 'rate limited' }, 429));

    await expect(gql('query { applications { id } }')).rejects.toThrow(
      new ApiError(`Unexpected response from ${API_URL} (HTTP 429)`),
    );
  });

  it('rejects a body that is not JSON at all', async () => {
    fetchMock.mockResolvedValue(respond('<html><body>502 Bad Gateway</body></html>', 502));

    await expect(gql('query { applications { id } }')).rejects.toThrow(
      new ApiError(`Unexpected response from ${API_URL} (HTTP 502)`),
    );
  });

  it.each([
    ['a JSON null body', 'null'],
    ['a JSON array body', '[]'],
    ['a bare JSON string', '"nope"'],
  ])('rejects %s', async (_label, raw) => {
    fetchMock.mockResolvedValue(respond(raw, 200));

    await expect(gql('query { applications { id } }')).rejects.toBeInstanceOf(ApiError);
  });

  it('accepts an errors-only envelope — `data` is optional in the spec', async () => {
    fetchMock.mockResolvedValue(respondJson({ errors: [{ message: 'boom' }] }));

    await expect(gql('query { applications { id } }')).rejects.toThrow(new ApiError('boom'));
  });

  it('accepts an empty errors array and yields an empty data object', async () => {
    fetchMock.mockResolvedValue(respondJson({ errors: [] }));

    await expect(gql('query { applications { id } }')).resolves.toEqual({});
  });

  it('accepts a null data field — a top-level nullable field that resolved to null', async () => {
    fetchMock.mockResolvedValue(respondJson({ data: null }));

    await expect(gql('query { application { id } }')).resolves.toEqual({});
  });
});
