import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp, type TestApp } from './helpers/buildTestApp.js';
import { ENV } from '#src/constants.js';

describe('oauth routes — redirect_uri behind Vercel-style reverse proxy', () => {
  let testApp: TestApp;
  const originalClientId = process.env[ENV.GITHUB_OAUTH_CLIENT_ID];

  beforeAll(async () => {
    testApp = await buildTestApp();
    // GitHubOAuthProvider only reads this at construction (first resolve
    // from the DI container) — set before the first request that touches
    // an oauth route in this file.
    process.env[ENV.GITHUB_OAUTH_CLIENT_ID] = 'test-github-client-id';
  }, 30_000);

  afterAll(async () => {
    if (originalClientId === undefined) delete process.env[ENV.GITHUB_OAUTH_CLIENT_ID];
    else process.env[ENV.GITHUB_OAUTH_CLIENT_ID] = originalClientId;
    await testApp.cleanup();
  });

  it('builds an https:// redirect_uri from X-Forwarded-Proto, not the (always-http) raw socket', async () => {
    // No TLS involved in this in-process inject() call at all — this is
    // exactly the situation index.ts is actually in on Vercel: the real
    // request was HTTPS, but Node's own connection to the function isn't,
    // so only trustProxy + this header tell Fastify the truth.
    const res = await testApp.app.inject({
      method: 'GET',
      url: '/auth/oauth/github/start',
      headers: {
        host: 'api.trakwyn.com',
        'x-forwarded-proto': 'https',
      },
    });

    expect(res.statusCode).toBe(302);
    const location = new URL(res.headers.location as string);
    expect(location.searchParams.get('redirect_uri')).toBe(
      'https://api.trakwyn.com/auth/oauth/github/callback',
    );
  });

  it('falls back to http:// when there is no X-Forwarded-Proto, matching a direct (non-proxied) connection', async () => {
    const res = await testApp.app.inject({
      method: 'GET',
      url: '/auth/oauth/github/start',
      headers: { host: 'api.trakwyn.com' },
    });

    expect(res.statusCode).toBe(302);
    const location = new URL(res.headers.location as string);
    expect(location.searchParams.get('redirect_uri')).toBe(
      'http://api.trakwyn.com/auth/oauth/github/callback',
    );
  });
});

describe('oauth routes — state is bound to the browser that started the flow', () => {
  let testApp: TestApp;
  const originalClientId = process.env[ENV.GITHUB_OAUTH_CLIENT_ID];

  beforeAll(async () => {
    testApp = await buildTestApp();
    process.env[ENV.GITHUB_OAUTH_CLIENT_ID] = 'test-github-client-id';
  }, 30_000);

  afterAll(async () => {
    if (originalClientId === undefined) delete process.env[ENV.GITHUB_OAUTH_CLIENT_ID];
    else process.env[ENV.GITHUB_OAUTH_CLIENT_ID] = originalClientId;
    await testApp.cleanup();
  });

  /** Runs /start and returns the state the provider would echo back, plus the cookie set alongside it. */
  async function beginFlow(): Promise<{ state: string; stateCookie: string | undefined }> {
    const res = await testApp.app.inject({
      method: 'GET',
      url: '/auth/oauth/github/start',
      headers: { host: 'api.trakwyn.com', 'x-forwarded-proto': 'https' },
    });
    const state = new URL(res.headers.location as string).searchParams.get('state')!;
    const cookies = res.cookies as Array<{ name: string; value: string }>;
    return { state, stateCookie: cookies.find((c) => c.name === 'trakwyn_oauth_state')?.value };
  }

  const callback = (state: string, cookies?: Record<string, string>) =>
    testApp.app.inject({
      method: 'GET',
      url: `/auth/oauth/github/callback?code=some-code&state=${encodeURIComponent(state)}`,
      headers: { host: 'api.trakwyn.com', 'x-forwarded-proto': 'https' },
      ...(cookies ? { cookies } : {}),
    });

  it('sets a state cookie when the flow begins', async () => {
    const { stateCookie } = await beginFlow();

    expect(stateCookie).toBeTruthy();
  });

  it('refuses a valid, correctly-signed state presented by a browser that never started the flow', async () => {
    // The attack: an attacker runs the flow themselves, keeps their own valid
    // code + state, and hands the victim the callback URL. The signature
    // verifies — it really is one of ours — but the victim's browser has no
    // matching cookie, so it cannot be the browser this was issued to.
    const { state } = await beginFlow();

    const res = await callback(state);

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toContain('oauthError=invalid_state');
    // Above all: no session may be handed to the victim.
    const names = (res.cookies as Array<{ name: string; value: string }>)
      .filter((c) => c.value !== '')
      .map((c) => c.name);
    expect(names).not.toContain('trakwyn_access_token');
    expect(names).not.toContain('trakwyn_refresh_token');
  });

  it('refuses a state whose nonce does not match the cookie', async () => {
    const { state } = await beginFlow();
    const other = await beginFlow();

    // Both are real states from real flows — but crossed over.
    const res = await callback(state, { trakwyn_oauth_state: other.stateCookie! });

    expect(res.headers.location).toContain('oauthError=invalid_state');
  });

  it('gets past the binding check when the cookie matches, and fails later on the code instead', async () => {
    const { state, stateCookie } = await beginFlow();

    const res = await callback(state, { trakwyn_oauth_state: stateCookie! });

    // The token exchange is what fails now (there is no real GitHub here),
    // which is proof the binding check itself passed.
    expect(res.headers.location).toContain('oauthError=');
    expect(res.headers.location).not.toContain('oauthError=invalid_state');
  });

  it('clears the state cookie on the way out, so a stale nonce cannot block the next attempt', async () => {
    const { state, stateCookie } = await beginFlow();

    const res = await callback(state, { trakwyn_oauth_state: stateCookie! });

    const cleared = (res.cookies as Array<{ name: string; value: string }>).find(
      (c) => c.name === 'trakwyn_oauth_state',
    );
    expect(cleared?.value).toBe('');
  });

  it('clears the state cookie even when the provider reports an error', async () => {
    const res = await testApp.app.inject({
      method: 'GET',
      url: '/auth/oauth/github/callback?error=access_denied',
      headers: { host: 'api.trakwyn.com', 'x-forwarded-proto': 'https' },
      cookies: { trakwyn_oauth_state: 'whatever' },
    });

    const cleared = (res.cookies as Array<{ name: string; value: string }>).find(
      (c) => c.name === 'trakwyn_oauth_state',
    );
    expect(cleared?.value).toBe('');
  });
});
