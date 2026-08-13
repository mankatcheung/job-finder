import { GraphQLClient } from 'graphql-request';
import { queryClient } from '#/lib/queryClient';
import { DEFAULT_API_URL, ERROR_CODES } from '#/constants';

const API_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;

const REFRESH_MUTATION = `mutation { refreshToken }`;

// Non-HttpOnly hint cookie the API sets alongside the real HttpOnly
// jf_access_token/jf_refresh_token cookies (apps/api's setAuthCookies()) —
// must match COOKIES.LOGGED_IN there. The web app can never read the real
// tokens (by design), so this is how it knows a session likely exists
// without a network round-trip.
const LOGGED_IN_COOKIE = 'jf_logged_in';

/**
 * Synchronous, no network call: used by route beforeLoad guards to decide
 * whether to redirect to /login before rendering. This only needs to be
 * directionally correct, not authoritative — the real access token cookie
 * is attached automatically by the browser on every request (see
 * `credentials: 'include'` below), and any request that finds it
 * missing/expired gets silently refreshed and retried by
 * responseMiddleware regardless of what this returned.
 */
export function hasSessionCookie(): boolean {
  return document.cookie.split('; ').some((entry) => entry.startsWith(`${LOGGED_IN_COOKIE}=`));
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
    return (json.data?.refreshToken ?? null) !== null;
  } catch {
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

export const gqlClient = new GraphQLClient(API_URL, {
  credentials: 'include',
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
      // Fresh access-token cookie is set — re-run all active queries so they pick it up.
      await queryClient.invalidateQueries();
    } else {
      queryClient.clear();
      window.location.href = '/login';
    }
  },
});
