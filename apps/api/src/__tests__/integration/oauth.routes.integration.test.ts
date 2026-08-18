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
