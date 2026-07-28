import { GraphQLClient } from 'graphql-request';
import { queryClient } from '#/lib/queryClient';
import { DEFAULT_API_URL, ERROR_CODES } from '#/constants';

const API_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
const BEARER_PREFIX = 'Bearer ';

const REFRESH_MUTATION = `mutation { refreshToken }`;

/**
 * Held in memory only (never localStorage/sessionStorage) to bound XSS
 * exposure to this token's 15-minute lifetime. The API and web app are on
 * separate domains, so this — not the HttpOnly cookie the API also sets —
 * is what the web app can actually read; it's attached to every request via
 * the requestMiddleware below.
 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  try {
    const raw = await fetch(API_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: REFRESH_MUTATION }),
    });
    const json = (await raw.json()) as {
      data?: { refreshToken?: string | null };
      errors?: unknown[];
    };
    const token = json.data?.refreshToken ?? null;
    setAccessToken(token);
    return token !== null;
  } catch {
    setAccessToken(null);
    return false;
  }
}

function getOrStartRefresh(): Promise<boolean> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = doRefresh().finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }
  return refreshPromise!;
}

/**
 * Ensures an access token is in memory, attempting a silent refresh (relying
 * on the cross-site-capable refresh cookie) only when one isn't already
 * held — cheap on in-app navigations, one deduped network call on a cold
 * page load. Shared with the 401-retry path in responseMiddleware below via
 * the same getOrStartRefresh() singleton.
 */
export async function hydrateSession(): Promise<boolean> {
  if (accessToken) return true;
  return getOrStartRefresh();
}

export const gqlClient = new GraphQLClient(API_URL, {
  credentials: 'include',
  requestMiddleware: (request) => ({
    ...request,
    headers: accessToken
      ? { ...request.headers, Authorization: `${BEARER_PREFIX}${accessToken}` }
      : request.headers,
  }),
  responseMiddleware: async (response) => {
    // graphql-request v7 wraps GraphQL errors in a ClientError (extends Error).
    // The errors live on response.response.errors, not directly on response.
    const payload =
      response instanceof Error
        ? (
            response as unknown as {
              response?: { errors?: Array<{ extensions?: { code?: string } }> };
            }
          ).response
        : (response as { errors?: Array<{ extensions?: { code?: string } }> });

    const hasUnauthorized = payload?.errors?.some(
      (e) => e.extensions?.code === ERROR_CODES.UNAUTHORIZED,
    );

    if (!hasUnauthorized) return;

    const ok = await getOrStartRefresh();
    if (ok) {
      // New access token is set — re-run all active queries so they pick it up.
      await queryClient.invalidateQueries();
    } else {
      queryClient.clear();
      window.location.href = '/login';
    }
  },
});
