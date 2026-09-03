import { GraphQLClient, ClientError } from 'graphql-request';
import { API_URL, ERROR_CODES } from '../constants';
import { getTokens, setTokens, clearTokens, type TokenPair } from '../auth/tokenStorage';

const REFRESH_TOKEN_MOBILE_MUTATION = `
  mutation RefreshTokenMobile($refreshToken: String!) {
    refreshTokenMobile(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

type SessionExpiredListener = () => void;
let sessionExpiredListener: SessionExpiredListener | null = null;

/** AuthContext subscribes here to learn when a refresh attempt has failed outright, so it can drop back to the auth stack. */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListener = listener;
  return () => {
    if (sessionExpiredListener === listener) sessionExpiredListener = null;
  };
}

let accessToken: string | null = null;

/** Kept in memory (not just secure storage) so every request can attach it synchronously without an async storage read per call. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** For non-GraphQL callers (e.g. the chat SSE stream) that need the current bearer token directly. */
export function getAccessToken(): string | null {
  return accessToken;
}

const rawClient = new GraphQLClient(API_URL);

let isRefreshing = false;
let refreshPromise: Promise<TokenPair | null> | null = null;

async function doRefresh(): Promise<TokenPair | null> {
  const tokens = await getTokens();
  if (!tokens) return null;
  try {
    const data = await rawClient.request<{ refreshTokenMobile: TokenPair }>(
      REFRESH_TOKEN_MOBILE_MUTATION,
      { refreshToken: tokens.refreshToken },
    );
    await setTokens(data.refreshTokenMobile);
    setAccessToken(data.refreshTokenMobile.accessToken);
    return data.refreshTokenMobile;
  } catch {
    return null;
  }
}

function getOrStartRefresh(): Promise<TokenPair | null> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = doRefresh().finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }
  return refreshPromise!;
}

function isUnauthorized(error: unknown): boolean {
  if (!(error instanceof ClientError)) return false;
  return (
    error.response.errors?.some((e) => e.extensions?.code === ERROR_CODES.UNAUTHORIZED) ?? false
  );
}

function authHeaders(token: string | null): HeadersInit | undefined {
  return token ? { authorization: `Bearer ${token}` } : undefined;
}

/**
 * Every mobile screen goes through this instead of graphql-request directly:
 * it attaches the current access token, and on an UNAUTHORIZED response
 * transparently refreshes once (mirroring apps/web's responseMiddleware)
 * before retrying — refreshTokenMobile itself is called via the raw client
 * so a failed refresh can't recurse back into this same retry path.
 */
export async function gqlRequest<T>(query: string, variables?: object): Promise<T> {
  try {
    return await rawClient.request<T>(query, variables, authHeaders(accessToken));
  } catch (error) {
    if (!isUnauthorized(error)) throw error;

    const refreshed = await getOrStartRefresh();
    if (!refreshed) {
      await clearTokens();
      setAccessToken(null);
      sessionExpiredListener?.();
      throw error;
    }

    return rawClient.request<T>(query, variables, authHeaders(refreshed.accessToken));
  }
}
