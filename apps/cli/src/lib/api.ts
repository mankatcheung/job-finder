import { getApiKey, getApiUrl } from './config.js';

export class AuthError extends Error {
  constructor() {
    super('No API key set. Run: jf auth set-key');
    this.name = 'AuthError';
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function rawGql(
  query: string,
  variables: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const apiUrl = getApiUrl();
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as {
    data?: Record<string, unknown>;
    errors?: { message: string; extensions?: { code?: string } }[];
  };

  if (json.errors?.length) {
    const first = json.errors[0];
    if (first.extensions?.code === 'UNAUTHORIZED') throw new AuthError();
    throw new ApiError(first.message);
  }

  return json.data ?? {};
}

export async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) throw new AuthError();
  const data = await rawGql(query, variables, { Authorization: `Bearer ${apiKey}` });
  return data as T;
}
