import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { buildTestApp, type TestApp } from './helpers/buildTestApp.js';

const REGISTER_MOBILE_MUTATION = `
  mutation RegisterMobile($email: String!, $password: String!) {
    registerMobile(email: $email, password: $password) {
      accessToken
      refreshToken
    }
  }
`;

const LOGIN_MOBILE_MUTATION = `
  mutation LoginMobile($email: String!, $password: String!) {
    loginMobile(email: $email, password: $password) {
      success
      totpRequired
      accessToken
      refreshToken
    }
  }
`;

const REFRESH_TOKEN_MOBILE_MUTATION = `
  mutation RefreshTokenMobile($refreshToken: String!) {
    refreshTokenMobile(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

const ME_QUERY = `
  query Me {
    me {
      id
      email
    }
  }
`;

interface GraphQLResponse<T> {
  data: T | null;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

const COOKIE_NAMES = ['trakwyn_access_token', 'trakwyn_refresh_token', 'trakwyn_logged_in'];

describe('mobile auth integration', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await buildTestApp();
  }, 30_000);

  afterAll(async () => {
    await testApp.cleanup();
  });

  it('registers a new user and returns a usable access + refresh token pair, without setting cookies', async () => {
    const email = `${randomUUID()}@example.com`;

    const registerRes = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: REGISTER_MOBILE_MUTATION,
        variables: { email, password: 'correct-horse-1' },
      },
    });
    const registerBody = registerRes.json() as GraphQLResponse<{
      registerMobile: { accessToken: string; refreshToken: string };
    }>;
    expect(registerBody.errors).toBeUndefined();
    const { accessToken, refreshToken } = registerBody.data!.registerMobile;
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');
    expect(accessToken.length).toBeGreaterThan(0);
    expect(refreshToken.length).toBeGreaterThan(0);

    for (const name of COOKIE_NAMES) {
      expect(registerRes.cookies.find((c) => c.name === name)).toBeUndefined();
    }

    const meRes = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { query: ME_QUERY },
    });
    const meBody = meRes.json() as GraphQLResponse<{ me: { id: string; email: string } }>;
    expect(meBody.errors).toBeUndefined();
    expect(meBody.data!.me.email).toBe(email);
  });

  it('logs in with correct credentials and rejects the wrong password', async () => {
    const email = `${randomUUID()}@example.com`;
    const password = 'correct-horse-2';

    await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: `mutation Register($email: String!, $password: String!) { register(email: $email, password: $password) }`,
        variables: { email, password },
      },
    });

    const loginRes = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: LOGIN_MOBILE_MUTATION, variables: { email, password } },
    });
    const loginBody = loginRes.json() as GraphQLResponse<{
      loginMobile: {
        success: boolean;
        totpRequired: boolean;
        accessToken: string | null;
        refreshToken: string | null;
      };
    }>;
    expect(loginBody.errors).toBeUndefined();
    expect(loginBody.data!.loginMobile).toEqual({
      success: true,
      totpRequired: false,
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    for (const name of COOKIE_NAMES) {
      expect(loginRes.cookies.find((c) => c.name === name)).toBeUndefined();
    }

    const wrongRes = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: LOGIN_MOBILE_MUTATION, variables: { email, password: 'wrong-password' } },
    });
    const wrongBody = wrongRes.json() as GraphQLResponse<{ loginMobile: null }>;
    expect(wrongBody.data).toEqual({ loginMobile: null });
    expect(wrongBody.errors?.[0]?.extensions?.code).toBe('UNAUTHORIZED');
  });

  it('rotates the refresh token and issues a new usable access token', async () => {
    const email = `${randomUUID()}@example.com`;
    const password = 'correct-horse-3';

    const registerRes = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: REGISTER_MOBILE_MUTATION, variables: { email, password } },
    });
    const { refreshToken } = (
      registerRes.json() as GraphQLResponse<{
        registerMobile: { accessToken: string; refreshToken: string };
      }>
    ).data!.registerMobile;

    const refreshRes = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: REFRESH_TOKEN_MOBILE_MUTATION, variables: { refreshToken } },
    });
    const refreshBody = refreshRes.json() as GraphQLResponse<{
      refreshTokenMobile: { accessToken: string; refreshToken: string };
    }>;
    expect(refreshBody.errors).toBeUndefined();
    expect(typeof refreshBody.data!.refreshTokenMobile.accessToken).toBe('string');
    expect(typeof refreshBody.data!.refreshTokenMobile.refreshToken).toBe('string');

    const meRes = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { authorization: `Bearer ${refreshBody.data!.refreshTokenMobile.accessToken}` },
      payload: { query: ME_QUERY },
    });
    expect((meRes.json() as GraphQLResponse<{ me: { email: string } }>).data!.me.email).toBe(email);
  });

  it('rejects refreshTokenMobile with an invalid refresh token', async () => {
    const res = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: REFRESH_TOKEN_MOBILE_MUTATION,
        variables: { refreshToken: 'not-a-real-token' },
      },
    });
    const body = res.json() as GraphQLResponse<{ refreshTokenMobile: null }>;
    expect(body.data).toEqual({ refreshTokenMobile: null });
    expect(body.errors?.[0]?.extensions?.code).toBe('UNAUTHORIZED');
  });
});
