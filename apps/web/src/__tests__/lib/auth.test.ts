import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({ handler: (fn: () => unknown) => fn }),
}));

vi.mock('@tanstack/react-start/server', () => ({
  getCookie: vi.fn(),
}));

import { clearAuthIndicator, isAuthenticated } from '#/lib/auth';

function clearAllCookies() {
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; path=/`;
  });
}

describe('isAuthenticated', () => {
  beforeEach(clearAllCookies);

  it('returns false when no cookies are set', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('returns true when jf_logged_in cookie is present', () => {
    document.cookie = 'jf_logged_in=1';
    expect(isAuthenticated()).toBe(true);
  });

  it('returns true when jf_logged_in is among multiple cookies', () => {
    document.cookie = 'other=value';
    document.cookie = 'jf_logged_in=1';
    expect(isAuthenticated()).toBe(true);
  });

  it('returns false when only a similarly-named cookie exists', () => {
    document.cookie = 'jf_logged_in_extra=1';
    expect(isAuthenticated()).toBe(false);
  });
});

describe('clearAuthIndicator', () => {
  beforeEach(clearAllCookies);

  it('removes the jf_logged_in cookie', () => {
    document.cookie = 'jf_logged_in=1';
    expect(isAuthenticated()).toBe(true);
    clearAuthIndicator();
    expect(isAuthenticated()).toBe(false);
  });

  it('does not affect other cookies', () => {
    document.cookie = 'other=value';
    document.cookie = 'jf_logged_in=1';
    clearAuthIndicator();
    expect(document.cookie).toContain('other=value');
  });
});
