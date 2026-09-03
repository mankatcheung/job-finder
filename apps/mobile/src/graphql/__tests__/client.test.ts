import { GraphQLClient, ClientError } from 'graphql-request';

jest.mock('../../auth/tokenStorage', () => ({
  getTokens: jest.fn(),
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
}));

import { getTokens, setTokens, clearTokens } from '../../auth/tokenStorage';
import { gqlRequest, setAccessToken, onSessionExpired } from '../client';

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

describe('gqlRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAccessToken(null);
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
    mockedGetTokens.mockResolvedValueOnce({
      accessToken: 'stale-token',
      refreshToken: 'refresh-token',
    });
    requestSpy
      .mockRejectedValueOnce(unauthorizedError()) // original request
      .mockResolvedValueOnce({
        refreshTokenMobile: { accessToken: 'fresh-token', refreshToken: 'new-refresh-token' },
      }) // refresh call
      .mockResolvedValueOnce({ me: { id: '1' } }); // retried original request

    const result = await gqlRequest<{ me: { id: string } }>('query Me { me { id } }');

    expect(result).toEqual({ me: { id: '1' } });
    expect(mockedSetTokens).toHaveBeenCalledWith({
      accessToken: 'fresh-token',
      refreshToken: 'new-refresh-token',
    });
    // Final retry uses the freshly-refreshed access token.
    expect(requestSpy).toHaveBeenLastCalledWith('query Me { me { id } }', undefined, {
      authorization: 'Bearer fresh-token',
    });
  });

  it('clears tokens and notifies listeners when there is no refresh token to use', async () => {
    const listener = jest.fn();
    onSessionExpired(listener);
    mockedGetTokens.mockResolvedValueOnce(null);
    requestSpy.mockRejectedValueOnce(unauthorizedError());

    await expect(gqlRequest('query { ok }')).rejects.toThrow();

    expect(mockedClearTokens).toHaveBeenCalled();
    expect(listener).toHaveBeenCalled();
  });

  it('clears tokens and notifies listeners when the refresh call itself fails', async () => {
    const listener = jest.fn();
    onSessionExpired(listener);
    mockedGetTokens.mockResolvedValueOnce({
      accessToken: 'stale-token',
      refreshToken: 'dead-refresh-token',
    });
    requestSpy
      .mockRejectedValueOnce(unauthorizedError()) // original request
      .mockRejectedValueOnce(new Error('refresh rejected')); // refresh call itself fails

    await expect(gqlRequest('query { ok }')).rejects.toThrow();

    expect(mockedClearTokens).toHaveBeenCalled();
    expect(listener).toHaveBeenCalled();
  });
});
