/**
 * Centralised configuration and magic-value constants for the HTMX app.
 *
 * Out of scope by design (kept next to their usage): Tailwind classes,
 * GraphQL query text, HTML fragments, page route paths, and one-off copy.
 */

/** Environment-variable key names. */
export const ENV = {
  API_URL: 'API_URL',
} as const;

/** Fallback GraphQL endpoint when `API_URL` is unset. */
export const DEFAULT_API_URL = 'http://localhost:3001/graphql';

/** GraphQL error `extensions.code` values surfaced by the API. */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

/** Auth cookie names shared with the API. */
export const COOKIES = {
  ACCESS_TOKEN: 'jf_access_token',
  REFRESH_TOKEN: 'jf_refresh_token',
} as const;

/** Builds a `Set-Cookie` header value that immediately expires the named cookie. */
export function expiredCookie(name: string): string {
  return `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`;
}
