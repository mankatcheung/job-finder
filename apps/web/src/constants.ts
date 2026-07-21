/**
 * Centralised configuration and magic-value constants for the web app.
 *
 * Out of scope by design (kept next to their usage): Tailwind classes,
 * GraphQL query text, React Query keys, and one-off user-facing copy.
 *
 * Note: `import.meta.env.VITE_*` is intentionally accessed statically at its
 * call site — Vite replaces those references at build time, so they must not
 * be turned into dynamic property lookups.
 */

/** GraphQL error `extensions.code` values surfaced by the API. */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

/** Fallback GraphQL endpoint when `VITE_API_URL` is unset (dev proxy path). */
export const DEFAULT_API_URL = '/graphql';

/** Cookie names shared with the API. */
export const COOKIES = {
  /** Non-HttpOnly hint cookie the API sets so the client knows a session exists. */
  LOGGED_IN: 'jf_logged_in',
} as const;

export const COOKIE_PATH = '/';
