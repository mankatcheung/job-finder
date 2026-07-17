import { GraphQLClient } from 'graphql-request';
import { clearAuthIndicator } from '#/lib/auth';

const API_URL = import.meta.env.VITE_API_URL ?? '/graphql';

const REFRESH_MUTATION = `mutation { refreshToken }`;

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
    const json = (await raw.json()) as { data?: { refreshToken?: boolean }; errors?: unknown[] };
    return json.data?.refreshToken === true;
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
    if (response instanceof Error) return;

    const gqlErrors = (response as { errors?: Array<{ extensions?: { code?: string } }> }).errors;
    const hasUnauthorized = gqlErrors?.some((e) => e.extensions?.code === 'UNAUTHORIZED');

    if (hasUnauthorized) {
      const ok = await getOrStartRefresh();
      if (!ok) {
        clearAuthIndicator();
        window.location.href = '/login';
      }
    }
  },
});
