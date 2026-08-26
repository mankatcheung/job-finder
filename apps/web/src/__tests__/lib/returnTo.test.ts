import { describe, expect, it } from 'vitest';
import { safeReturnTo } from '#/lib/returnTo';

describe('safeReturnTo', () => {
  it('defaults to the dashboard when nothing was captured', () => {
    expect(safeReturnTo(undefined)).toBe('/dashboard');
    expect(safeReturnTo(null)).toBe('/dashboard');
    expect(safeReturnTo('')).toBe('/dashboard');
  });

  it('keeps same-origin paths, including their query strings', () => {
    expect(safeReturnTo('/applications')).toBe('/applications');
    expect(safeReturnTo('/applications/abc123?tab=notes')).toBe('/applications/abc123?tab=notes');
  });

  it('discards protocol-relative and absolute URLs', () => {
    // A returnTo that leaves the site would make post-login navigation an
    // open redirect.
    expect(safeReturnTo('//evil.example')).toBe('/dashboard');
    expect(safeReturnTo('https://evil.example/phish')).toBe('/dashboard');
  });

  it('never sends an authenticated user back into an auth entry page', () => {
    // /login would re-trigger the logged-in guard and loop; /register is a
    // dead end once signed in.
    expect(safeReturnTo('/login')).toBe('/dashboard');
    expect(safeReturnTo('/register')).toBe('/dashboard');
  });
});
