/**
 * Centralised configuration and magic-value constants for the CLI.
 *
 * Out of scope by design (kept next to their usage): GraphQL query text,
 * chalk styling, and one-off user-facing copy.
 */

/** Fallback GraphQL endpoint when the user hasn't configured one. */
export const DEFAULT_API_URL = 'http://localhost:3001/graphql';

/** On-disk config location under the user's home directory. */
export const CONFIG = {
  DIR_NAME: '.trakwyn',
  FILE_NAME: 'config.json',
  /** Owner read/write only — the file holds an API key. */
  FILE_MODE: 0o600,
} as const;

/** GraphQL error `extensions.code` values surfaced by the API. */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

/** HTTP Authorization header. */
export const AUTH_HEADER = {
  BEARER_PREFIX: 'Bearer ',
} as const;

/** Prefix every API token (`trakwyn_...`) starts with. */
export const API_TOKEN_PREFIX = 'trakwyn_';
