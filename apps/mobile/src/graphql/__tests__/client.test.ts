import { GraphQLClient, ClientError } from 'graphql-request';

jest.mock('../../auth/tokenStorage', () => ({
  getTokens: jest.fn(),
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
}));
jest.mock('../../lib/userAgent', () => ({
  buildUserAgent: () => 'TrakwynMobile/test (Test; TestOS 1)',
}));

import { getTokens, setTokens, clearTokens } from '../../auth/tokenStorage';
import {
  gqlRequest,
  getValidAccessToken,
  recoverFromUnauthorized,
  setAccessToken,
  onSessionExpired,
} from '../client';

const mockedGetTokens = jest.mocked(getTokens);
const mockedSetTokens = jest.mocked(setTokens);
const mockedClearTokens = jest.mocked(clearTokens);

// The real GraphQLClient class is used (so `new GraphQLClient(...)` inside
// client.ts still produces a real instance ClientError.response checks work
// against), with only its `request` method replaced per-test.
const requestSpy = jest.spyOn(GraphQLClient.prototype, 'request');

function unauthorizedError(): ClientError {
  return new ClientError(
    { errors: [{ extensions: { code: 'UNAUTHORIZED' } }] } as never,
    { query: '' } as never,
  );
}

/** An unsigned JWT whose payload carries only `exp` — client.ts reads that and nothing else. */
function jwtExpiringAt(epochSeconds: number): string {
  const payload = btoa(JSON.stringify({ exp: epochSeconds }));
  return `header.${payload}.signature`;
}
const freshJwt = () => jwtExpiringAt(Math.floor(Date.now() / 1000) + 3600);
const staleJwt = () => jwtExpiringAt(Math.floor(Date.now() / 1000) - 60);

const storedPair = { accessToken: 'stale-token', refreshToken: 'refresh-token' };
const refreshedPair = { accessToken: 'fresh-token', refreshToken: 'new-refresh-token' };
const refreshResponse = { refreshTokenMobile: refreshedPair };

const isRefreshCall = (call: unknown[]) => String(call[0]).includes('refreshTokenMobile');

describe('gqlRequest', () => {
  let listener: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setAccessToken(null);
    mockedSetTokens.mockResolvedValue(undefined);
    mockedClearTokens.mockResolvedValue(undefined);
    listener = jest.fn();
    onSessionExpired(listener);
  });

  it('attaches the current access token as a bearer header', async () => {
    setAccessToken('token-123');
    requestSpy.mockResolvedValueOnce({ me: { id: '1' } });

    await gqlRequest('query Me { me { id } }');

    expect(requestSpy).toHaveBeenCalledWith('query Me { me { id } }', undefined, {
      authorization: 'Bearer token-123',
    });
  });

  it('sends no authorization header when unauthenticated', async () => {
    requestSpy.mockResolvedValueOnce({ ok: true });

    await gqlRequest('query { ok }');

    expect(requestSpy).toHaveBeenCalledWith('query { ok }', undefined, undefined);
  });

  it('returns the response on success without touching the token store', async () => {
    requestSpy.mockResolvedValueOnce({ ok: true });

    await expect(gqlRequest('query { ok }')).resolves.toEqual({ ok: true });
    expect(mockedGetTokens).not.toHaveBeenCalled();
  });

  it('refreshes and retries once on an UNAUTHORIZED error, then succeeds', async () => {
    setAccessToken('stale-token');
    mockedGetTokens.mockResolvedValueOnce(storedPair);
    requestSpy
      .mockRejectedValueOnce(unauthorizedError()) // original request
      .mockResolvedValueOnce(refreshResponse) // refresh call
      .mockResolvedValueOnce({ me: { id: '1' } }); // retried original request

    const result = await gqlRequest<{ me: { id: string } }>('query Me { me { id } }');

    expect(result).toEqual({ me: { id: '1' } });
    expect(mockedSetTokens).toHaveBeenCalledWith(refreshedPair);
    // Final retry uses the freshly-refreshed access token.
    expect(requestSpy).toHaveBeenLastCalledWith('query Me { me { id } }', undefined, {
      authorization: 'Bearer fresh-token',
    });
  });

  // No token was sent, so UNAUTHORIZED is about the request — a wrong
  // password on the login screen — not about a session. Nothing to refresh,
  // nothing to clear, nobody to notify.
  it('leaves the session alone when an unauthenticated request is UNAUTHORIZED', async () => {
    requestSpy.mockRejectedValueOnce(unauthorizedError());

    await expect(gqlRequest('mutation { loginMobile }')).rejects.toThrow();

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(mockedGetTokens).not.toHaveBeenCalled();
    expect(mockedClearTokens).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not refresh or replay a credential mutation that opted out', async () => {
    setAccessToken(freshJwt());
    requestSpy.mockRejectedValueOnce(unauthorizedError()); // "Invalid password"

    await expect(
      gqlRequest('mutation { updatePassword }', undefined, { refreshOnUnauthorized: false }),
    ).rejects.toThrow();

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(mockedGetTokens).not.toHaveBeenCalled();
    expect(mockedClearTokens).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
  });

  it('refreshes a lapsed token *before* sending a credential mutation that opted out', async () => {
    setAccessToken(staleJwt());
    mockedGetTokens.mockResolvedValueOnce(storedPair);
    requestSpy
      .mockResolvedValueOnce(refreshResponse) // proactive refresh
      .mockResolvedValueOnce({ updatePassword: true }); // the mutation itself

    await gqlRequest('mutation { updatePassword }', undefined, { refreshOnUnauthorized: false });

    expect(requestSpy).toHaveBeenCalledTimes(2);
    expect(isRefreshCall(requestSpy.mock.calls[0]!)).toBe(true);
    expect(requestSpy).toHaveBeenLastCalledWith('mutation { updatePassword }', undefined, {
      authorization: 'Bearer fresh-token',
    });
  });

  it('ends the session when the refresh token itself is rejected', async () => {
    setAccessToken('stale-token');
    mockedGetTokens.mockResolvedValueOnce({ ...storedPair, refreshToken: 'dead-refresh-token' });
    requestSpy
      .mockRejectedValueOnce(unauthorizedError()) // original request
      .mockRejectedValueOnce(unauthorizedError()); // refreshTokenMobile: "Session revoked or expired"

    await expect(gqlRequest('query { ok }')).rejects.toThrow();

    expect(mockedClearTokens).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ends the session when there is no stored pair to refresh with', async () => {
    setAccessToken('stale-token');
    mockedGetTokens.mockResolvedValueOnce(null);
    requestSpy.mockRejectedValueOnce(unauthorizedError());

    await expect(gqlRequest('query { ok }')).rejects.toThrow();

    expect(mockedClearTokens).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  // A transport failure says nothing about the refresh token — deleting it
  // would turn a subway tunnel into a permanent sign-out.
  it('keeps the tokens when the refresh request cannot reach the server', async () => {
    setAccessToken('stale-token');
    mockedGetTokens.mockResolvedValueOnce(storedPair);
    const original = unauthorizedError();
    requestSpy
      .mockRejectedValueOnce(original) // original request
      .mockRejectedValueOnce(new TypeError('Network request failed')); // refresh never landed

    await expect(gqlRequest('query { ok }')).rejects.toBe(original);

    expect(mockedClearTokens).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
  });

  // Once the server has rotated, the old pair on disk would be presented on
  // the next launch and read as a stolen token — a clean sign-out is safer.
  it('ends the session when the refreshed pair cannot be persisted', async () => {
    setAccessToken('stale-token');
    mockedGetTokens.mockResolvedValueOnce(storedPair);
    mockedSetTokens.mockRejectedValueOnce(new Error('keystore unavailable'));
    requestSpy
      .mockRejectedValueOnce(unauthorizedError()) // original request
      .mockResolvedValueOnce(refreshResponse); // refresh succeeds server-side

    await expect(gqlRequest('query { ok }')).rejects.toThrow();

    expect(mockedClearTokens).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('retries with the current token, without refreshing, when another request already refreshed in flight', async () => {
    setAccessToken('old-token');
    requestSpy
      .mockImplementationOnce(async () => {
        // Simulates a concurrent request's refresh landing while this one was out.
        setAccessToken('fresh-from-elsewhere');
        throw unauthorizedError();
      })
      .mockResolvedValueOnce({ ok: true });

    await expect(gqlRequest('query { ok }')).resolves.toEqual({ ok: true });

    expect(mockedGetTokens).not.toHaveBeenCalled();
    expect(requestSpy).toHaveBeenLastCalledWith('query { ok }', undefined, {
      authorization: 'Bearer fresh-from-elsewhere',
    });
  });

  it('single-flights the refresh across concurrent UNAUTHORIZED responses', async () => {
    setAccessToken('stale-token');
    mockedGetTokens.mockResolvedValue(storedPair);
    requestSpy
      .mockRejectedValueOnce(unauthorizedError()) // request A
      .mockRejectedValueOnce(unauthorizedError()) // request B
      .mockResolvedValueOnce(refreshResponse) // the one shared refresh
      .mockResolvedValueOnce({ a: true })
      .mockResolvedValueOnce({ b: true });

    const [a, b] = await Promise.all([gqlRequest('query { a }'), gqlRequest('query { b }')]);

    expect(a).toEqual({ a: true });
    expect(b).toEqual({ b: true });
    expect(requestSpy.mock.calls.filter(isRefreshCall)).toHaveLength(1);
  });
});

describe('getValidAccessToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAccessToken(null);
    mockedSetTokens.mockResolvedValue(undefined);
    mockedClearTokens.mockResolvedValue(undefined);
  });

  it('returns null when there is no token at all', async () => {
    await expect(getValidAccessToken()).resolves.toBeNull();
    expect(mockedGetTokens).not.toHaveBeenCalled();
  });

  it('returns a token that is nowhere near expiry without a round-trip', async () => {
    const token = freshJwt();
    setAccessToken(token);

    await expect(getValidAccessToken()).resolves.toBe(token);
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('refreshes a token that is about to lapse and returns the new one', async () => {
    setAccessToken(staleJwt());
    mockedGetTokens.mockResolvedValueOnce(storedPair);
    requestSpy.mockResolvedValueOnce(refreshResponse);

    await expect(getValidAccessToken()).resolves.toBe('fresh-token');
    expect(mockedSetTokens).toHaveBeenCalledWith(refreshedPair);
  });

  it('treats an unparseable token as lapsed', async () => {
    setAccessToken('not-a-jwt');
    mockedGetTokens.mockResolvedValueOnce(storedPair);
    requestSpy.mockResolvedValueOnce(refreshResponse);

    await expect(getValidAccessToken()).resolves.toBe('fresh-token');
  });

  it('returns the stale token when the refresh cannot reach the server', async () => {
    const token = staleJwt();
    setAccessToken(token);
    mockedGetTokens.mockResolvedValueOnce(storedPair);
    requestSpy.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(getValidAccessToken()).resolves.toBe(token);
    expect(mockedClearTokens).not.toHaveBeenCalled();
  });

  it('returns null and ends the session when the refresh token is rejected', async () => {
    const listener = jest.fn();
    onSessionExpired(listener);
    setAccessToken(staleJwt());
    mockedGetTokens.mockResolvedValueOnce(storedPair);
    requestSpy.mockRejectedValueOnce(unauthorizedError());

    await expect(getValidAccessToken()).resolves.toBeNull();
    expect(mockedClearTokens).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('recoverFromUnauthorized', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAccessToken(null);
    mockedSetTokens.mockResolvedValue(undefined);
    mockedClearTokens.mockResolvedValue(undefined);
  });

  it('hands back the current token when it already changed since the request was sent', async () => {
    setAccessToken('newer');

    await expect(recoverFromUnauthorized('older')).resolves.toEqual({
      kind: 'retry',
      token: 'newer',
    });
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('refreshes and hands back the new token', async () => {
    setAccessToken('stale-token');
    mockedGetTokens.mockResolvedValueOnce(storedPair);
    requestSpy.mockResolvedValueOnce(refreshResponse);

    await expect(recoverFromUnauthorized('stale-token')).resolves.toEqual({
      kind: 'retry',
      token: 'fresh-token',
    });
  });

  it('reports the session as ended, and ends it, when the refresh token is rejected', async () => {
    const listener = jest.fn();
    onSessionExpired(listener);
    setAccessToken('stale-token');
    mockedGetTokens.mockResolvedValueOnce(storedPair);
    requestSpy.mockRejectedValueOnce(unauthorizedError());

    await expect(recoverFromUnauthorized('stale-token')).resolves.toEqual({ kind: 'ended' });
    expect(mockedClearTokens).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reports the server as unreachable without touching the tokens', async () => {
    setAccessToken('stale-token');
    mockedGetTokens.mockResolvedValueOnce(storedPair);
    requestSpy.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(recoverFromUnauthorized('stale-token')).resolves.toEqual({
      kind: 'unreachable',
    });
    expect(mockedClearTokens).not.toHaveBeenCalled();
  });
});
