import { DEFAULT_API_URL } from '#/constants';

// Mirrors the API_URL resolution in graphql/client.ts (not imported from
// there directly — that module is fully mocked in several component tests
// without an API_URL export, and this is a one-line computation not worth
// coupling to that mock surface for).
const API_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;

/**
 * Origin-only part of the API URL, for building absolute links to
 * non-GraphQL API routes (e.g. OAuth start endpoints) that work
 * identically whether VITE_API_URL is the dev-proxy-relative "/graphql" or
 * an absolute production URL like "https://api.trakwyn.com/graphql".
 *
 * In dev this resolves to "", so links built from it stay relative and are
 * covered by Vite's dev proxy (vite.config.ts) same as before. In
 * production, web and api are on different subdomains with no such proxy,
 * so an absolute origin is required or these links 404 against the web
 * app's own origin instead of reaching the API.
 */
export const API_ORIGIN = API_URL.replace(/\/graphql$/, '');
