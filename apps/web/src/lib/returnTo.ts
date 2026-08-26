/**
 * Validates a `returnTo` parameter — the location captured before an auth
 * redirect, honoured after login (JEF-233). Only same-origin absolute paths
 * count: a missing value falls back to the dashboard, and anything that
 * isn't a rooted path (`https://…`, `//evil.com`) is discarded rather than
 * turned into a redirect target.
 *
 * The two auth entry pages are never valid destinations — sending an
 * authenticated user to either would re-trigger the logged-in guard and
 * loop, or dead-end on the registration notice screen.
 */
export function safeReturnTo(value: string | undefined | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  if (value === '/login' || value === '/register') return '/dashboard';
  return value;
}
