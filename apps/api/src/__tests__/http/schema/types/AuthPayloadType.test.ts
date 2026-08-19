import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CookieOptions, IHttpResponse } from '#src/http/ports/IHttpResponse.js';
import { ENV, NODE_ENV } from '#src/constants.js';

function fakeReply(): {
  reply: IHttpResponse;
  cookies: Map<string, CookieOptions>;
  cleared: Map<string, Array<Pick<CookieOptions, 'path' | 'domain'>>>;
} {
  const cookies = new Map<string, CookieOptions>();
  const cleared = new Map<string, Array<Pick<CookieOptions, 'path' | 'domain'>>>();
  const reply: IHttpResponse = {
    status: () => reply,
    header: () => reply,
    send: () => {},
    redirect: () => {},
    setCookie: (name, _value, options) => {
      cookies.set(name, options ?? {});
    },
    clearCookie: (name, options) => {
      cleared.set(name, [...(cleared.get(name) ?? []), options ?? {}]);
    },
  };
  return { reply, cookies, cleared };
}

describe('setAuthCookies sameSite policy', () => {
  const originalNodeEnv = process.env[ENV.NODE_ENV];

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env[ENV.NODE_ENV];
    else process.env[ENV.NODE_ENV] = originalNodeEnv;
  });

  it('uses SameSite=Lax and non-Secure outside production', async () => {
    process.env[ENV.NODE_ENV] = 'development';
    vi.resetModules();
    const { setAuthCookies } = await import('#src/http/schema/types/AuthPayloadType.js');
    const { reply, cookies } = fakeReply();

    setAuthCookies(reply, 'access', 'refresh');

    expect(cookies.get('trakwyn_access_token')).toMatchObject({ sameSite: 'lax', secure: false });
    expect(cookies.get('trakwyn_refresh_token')).toMatchObject({ sameSite: 'lax', secure: false });
  });

  it('uses SameSite=None and Secure in production, so a cross-site refresh cookie is still sent', async () => {
    process.env[ENV.NODE_ENV] = NODE_ENV.PRODUCTION;
    vi.resetModules();
    const { setAuthCookies } = await import('#src/http/schema/types/AuthPayloadType.js');
    const { reply, cookies } = fakeReply();

    setAuthCookies(reply, 'access', 'refresh');

    expect(cookies.get('trakwyn_refresh_token')).toMatchObject({ sameSite: 'none', secure: true });
    expect(cookies.get('trakwyn_access_token')).toMatchObject({ sameSite: 'none', secure: true });
    expect(cookies.get('trakwyn_logged_in')).toMatchObject({ sameSite: 'none', secure: true });
  });
});

describe('setAuthCookies / clearAuthCookies domain policy', () => {
  const originalCookieDomain = process.env[ENV.COOKIE_DOMAIN];

  afterEach(() => {
    if (originalCookieDomain === undefined) delete process.env[ENV.COOKIE_DOMAIN];
    else process.env[ENV.COOKIE_DOMAIN] = originalCookieDomain;
  });

  it('omits domain when COOKIE_DOMAIN is unset, so cookies stay host-only', async () => {
    delete process.env[ENV.COOKIE_DOMAIN];
    vi.resetModules();
    const { setAuthCookies, clearAuthCookies } =
      await import('#src/http/schema/types/AuthPayloadType.js');
    const { reply, cookies, cleared } = fakeReply();

    setAuthCookies(reply, 'access', 'refresh');
    clearAuthCookies(reply);

    expect(cookies.get('trakwyn_logged_in')?.domain).toBeUndefined();
    expect(cleared.get('trakwyn_logged_in')).toEqual([{ path: '/' }]);
  });

  it('shares cookies across subdomains via COOKIE_DOMAIN, using the same value to clear them', async () => {
    process.env[ENV.COOKIE_DOMAIN] = '.trakwyn.com';
    vi.resetModules();
    const { setAuthCookies, clearAuthCookies } =
      await import('#src/http/schema/types/AuthPayloadType.js');
    const { reply, cookies, cleared } = fakeReply();

    setAuthCookies(reply, 'access', 'refresh');
    clearAuthCookies(reply);

    expect(cookies.get('trakwyn_access_token')).toMatchObject({ domain: '.trakwyn.com' });
    expect(cookies.get('trakwyn_refresh_token')).toMatchObject({ domain: '.trakwyn.com' });
    expect(cookies.get('trakwyn_logged_in')).toMatchObject({ domain: '.trakwyn.com' });
    // Domain-scoped clear from clearAuthCookies() itself, plus the
    // host-only legacy-cookie cleanup below — both, not either/or.
    for (const name of ['trakwyn_access_token', 'trakwyn_refresh_token', 'trakwyn_logged_in']) {
      expect(cleared.get(name)).toContainEqual({ path: '/', domain: '.trakwyn.com' });
      expect(cleared.get(name)).toContainEqual({ path: '/' });
    }
  });

  it('setAuthCookies also clears legacy host-only cookies when COOKIE_DOMAIN is set, so a pre-migration session self-heals on its next refresh', async () => {
    process.env[ENV.COOKIE_DOMAIN] = '.trakwyn.com';
    vi.resetModules();
    const { setAuthCookies } = await import('#src/http/schema/types/AuthPayloadType.js');
    const { reply, cleared } = fakeReply();

    setAuthCookies(reply, 'access', 'refresh');

    for (const name of ['trakwyn_access_token', 'trakwyn_refresh_token', 'trakwyn_logged_in']) {
      expect(cleared.get(name)).toEqual([{ path: '/' }]);
    }
  });

  it('setAuthCookies does not attempt a host-only clear when COOKIE_DOMAIN is unset (nothing legacy to clean up)', async () => {
    delete process.env[ENV.COOKIE_DOMAIN];
    vi.resetModules();
    const { setAuthCookies } = await import('#src/http/schema/types/AuthPayloadType.js');
    const { reply, cleared } = fakeReply();

    setAuthCookies(reply, 'access', 'refresh');

    expect(cleared.size).toBe(0);
  });
});
