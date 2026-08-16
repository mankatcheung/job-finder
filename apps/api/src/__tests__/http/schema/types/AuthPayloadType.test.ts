import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CookieOptions, IHttpResponse } from '#src/http/ports/IHttpResponse.js';
import { ENV, NODE_ENV } from '#src/constants.js';

function fakeReply(): { reply: IHttpResponse; cookies: Map<string, CookieOptions> } {
  const cookies = new Map<string, CookieOptions>();
  const reply: IHttpResponse = {
    status: () => reply,
    send: () => {},
    redirect: () => {},
    setCookie: (name, _value, options) => {
      cookies.set(name, options ?? {});
    },
    clearCookie: () => {},
  };
  return { reply, cookies };
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
