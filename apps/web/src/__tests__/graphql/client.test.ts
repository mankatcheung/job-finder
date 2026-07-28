import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({ handler: (fn: () => unknown) => fn }),
}));

vi.mock('@tanstack/react-start/server', () => ({
  getCookie: vi.fn(),
}));

type Middleware = (response: unknown) => Promise<void>;
type RequestMiddleware = (request: { headers: Headers }) => { headers: HeadersInit };

// GraphQLClient must be a real constructor (not an arrow fn) to support `new`
vi.mock('graphql-request', () => ({
  GraphQLClient: vi.fn(function (
    this: { responseMiddleware: Middleware; requestMiddleware: RequestMiddleware },
    _url: string,
    opts: { responseMiddleware?: Middleware; requestMiddleware?: RequestMiddleware },
  ) {
    this.responseMiddleware = opts?.responseMiddleware ?? (() => Promise.resolve());
    this.requestMiddleware = opts?.requestMiddleware ?? ((r) => r);
  }),
}));

const mockLocationHref = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    set href(v: string) {
      mockLocationHref(v);
    },
  },
  writable: true,
});

describe('refresh token deduplication', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    vi.resetModules();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    mockLocationHref.mockClear();
  });

  it('only makes one refresh request when called concurrently', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ data: { refreshToken: 'new-access-token' } }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { gqlClient } = await import('#/graphql/client');
    const middleware = (gqlClient as unknown as { responseMiddleware: Middleware })
      .responseMiddleware;
    const unauthorized = { errors: [{ extensions: { code: 'UNAUTHORIZED' } }] };

    await Promise.all([
      middleware(unauthorized),
      middleware(unauthorized),
      middleware(unauthorized),
    ]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('redirects to /login when refresh fails', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ data: { refreshToken: null } }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { gqlClient } = await import('#/graphql/client');
    const middleware = (gqlClient as unknown as { responseMiddleware: Middleware })
      .responseMiddleware;

    await middleware({ errors: [{ extensions: { code: 'UNAUTHORIZED' } }] });

    expect(mockLocationHref).toHaveBeenCalledWith('/login');
  });

  it('does not refresh when response has no UNAUTHORIZED error', async () => {
    const { gqlClient } = await import('#/graphql/client');
    const middleware = (gqlClient as unknown as { responseMiddleware: Middleware })
      .responseMiddleware;

    await middleware({ data: { applications: [] } });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not refresh when response is an Error instance', async () => {
    const { gqlClient } = await import('#/graphql/client');
    const middleware = (gqlClient as unknown as { responseMiddleware: Middleware })
      .responseMiddleware;

    await middleware(new Error('network error'));

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('access token', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    vi.resetModules();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    mockLocationHref.mockClear();
  });

  // graphql-request passes a real Headers instance (with Content-Type/Accept
  // already set) into requestMiddleware, not a plain object — spreading a
  // Headers instance with {...headers} silently produces {} and drops every
  // existing header, so these tests use a real Headers instance as input to
  // catch that regression.

  it('attaches no Authorization header before any token is set', async () => {
    const { gqlClient } = await import('#/graphql/client');
    const requestMiddleware = (gqlClient as unknown as { requestMiddleware: RequestMiddleware })
      .requestMiddleware;

    const result = requestMiddleware({
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });

    expect(new Headers(result.headers).get('Authorization')).toBeNull();
  });

  it('attaches Authorization: Bearer <token> once setAccessToken is called', async () => {
    const { gqlClient, setAccessToken } = await import('#/graphql/client');
    setAccessToken('abc123');
    const requestMiddleware = (gqlClient as unknown as { requestMiddleware: RequestMiddleware })
      .requestMiddleware;

    const result = requestMiddleware({
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });

    expect(new Headers(result.headers).get('Authorization')).toBe('Bearer abc123');
  });

  it('preserves existing headers (e.g. Content-Type) when attaching Authorization', async () => {
    const { gqlClient, setAccessToken } = await import('#/graphql/client');
    setAccessToken('abc123');
    const requestMiddleware = (gqlClient as unknown as { requestMiddleware: RequestMiddleware })
      .requestMiddleware;

    const result = requestMiddleware({
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });

    expect(new Headers(result.headers).get('Content-Type')).toBe('application/json');
  });

  it('stops attaching the header once setAccessToken(null) is called', async () => {
    const { gqlClient, setAccessToken } = await import('#/graphql/client');
    setAccessToken('abc123');
    setAccessToken(null);
    const requestMiddleware = (gqlClient as unknown as { requestMiddleware: RequestMiddleware })
      .requestMiddleware;

    const result = requestMiddleware({
      headers: new Headers({ 'Content-Type': 'application/json' }),
    });

    expect(new Headers(result.headers).get('Authorization')).toBeNull();
  });
});

describe('hydrateSession', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    vi.resetModules();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    mockLocationHref.mockClear();
  });

  it('makes no network call when a token is already in memory', async () => {
    const { setAccessToken, hydrateSession } = await import('#/graphql/client');
    setAccessToken('already-have-one');

    const authed = await hydrateSession();

    expect(authed).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('attempts a silent refresh and returns true when it succeeds', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ data: { refreshToken: 'fresh-token' } }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const { hydrateSession } = await import('#/graphql/client');

    const authed = await hydrateSession();

    expect(authed).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('returns false when the silent refresh fails', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ data: { refreshToken: null } }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const { hydrateSession } = await import('#/graphql/client');

    const authed = await hydrateSession();

    expect(authed).toBe(false);
  });

  it('dedupes with a concurrent 401-triggered refresh via the same underlying call', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ data: { refreshToken: 'shared-token' } }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const { gqlClient, hydrateSession } = await import('#/graphql/client');
    const middleware = (gqlClient as unknown as { responseMiddleware: Middleware })
      .responseMiddleware;

    await Promise.all([
      hydrateSession(),
      middleware({ errors: [{ extensions: { code: 'UNAUTHORIZED' } }] }),
    ]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
