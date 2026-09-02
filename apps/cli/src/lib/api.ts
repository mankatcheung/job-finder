import { getApiKey, getApiUrl } from './config.js';
import { AUTH_HEADER, ERROR_CODES } from '../constants.js';

export class AuthError extends Error {
  constructor() {
    super('No API key set. Run: tw auth set-key');
    this.name = 'AuthError';
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** One entry of a GraphQL response's `errors` array. */
interface GraphQLError {
  message: string;
  extensions?: { code?: string };
}

/**
 * The GraphQL-over-HTTP response envelope. Only the envelope is modelled:
 * `data` stays a bag of unknowns because its shape is per-query, and checking
 * it would mean one schema per query — the CLI treats a missing field as a bug
 * in the query text, not as untrusted input.
 */
interface GraphQLResponse {
  data?: Record<string, unknown>;
  errors?: GraphQLError[];
}

/**
 * Narrows untrusted JSON to the envelope. A GraphQL reply always carries
 * `data`, `errors`, or both; anything else came from something that isn't our
 * API — a proxy error page, a gateway's rate-limit body, a captive portal.
 *
 * Without this the assertion waves those through, `data` reads as `undefined`,
 * and the caller dereferences nothing: `tw apps list` died on
 * `data.applications.length` with a TypeError that named neither the API nor
 * the status it returned.
 */
function isGraphQLResponse(value: unknown): value is GraphQLResponse {
  if (typeof value !== 'object' || value === null) return false;
  const { data, errors } = value as GraphQLResponse;
  return data !== undefined || Array.isArray(errors);
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

  // An HTML error page rejects `json()` with a SyntaxError that would escape as
  // a bare "Unexpected error"; folding it into `null` routes it through the
  // same guard, and so through the same message.
  const body: unknown = await response.json().catch(() => null);
  if (!isGraphQLResponse(body)) {
    throw new ApiError(`Unexpected response from ${apiUrl} (HTTP ${response.status})`);
  }

  const [firstError] = body.errors ?? [];
  if (firstError) {
    if (firstError.extensions?.code === ERROR_CODES.UNAUTHORIZED) throw new AuthError();
    throw new ApiError(firstError.message);
  }

  return body.data ?? {};
}

export async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) throw new AuthError();
  const data = await rawGql(query, variables, {
    Authorization: `${AUTH_HEADER.BEARER_PREFIX}${apiKey}`,
  });
  return data as T;
}
