import { DEFAULT_API_URL, ENV, ERROR_CODES } from '../constants.js';

const API_URL = process.env[ENV.API_URL] ?? DEFAULT_API_URL;

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
  }
}

export class GqlError extends Error {
  constructor(public errors: unknown[]) {
    super('GraphQL error');
  }
}

export async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
  cookieHeader?: string,
): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string; extensions?: { code?: string } }>;
  };
  if (json.errors?.length) {
    if (json.errors.some((e) => e.extensions?.code === ERROR_CODES.UNAUTHORIZED))
      throw new UnauthorizedError();
    throw new GqlError(json.errors);
  }
  return json.data as T;
}

export async function gqlRaw(
  query: string,
  variables: Record<string, unknown> = {},
  cookieHeader?: string,
): Promise<Response> {
  return fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
}
