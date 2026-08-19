import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ROUTES } from '#src/constants.js';
import { buildTestApp, type TestApp } from './helpers/buildTestApp.js';

const REGISTER_MUTATION = `
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password)
  }
`;

const CREATE_API_TOKEN_MUTATION = `
  mutation CreateApiToken($name: String!, $scope: ApiTokenScope) {
    createApiToken(name: $name, scope: $scope) {
      token
    }
  }
`;

const CREATE_APPLICATION_MUTATION = `
  mutation CreateApplication($input: CreateApplicationInput!) {
    createApplication(input: $input) {
      id
      company
    }
  }
`;

interface GraphQLResponse<T> {
  data: T | null;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}

describe('mcp integration', () => {
  let testApp: TestApp;

  async function registerAndGetAccessToken(): Promise<string> {
    const email = `${randomUUID()}@example.com`;
    const res = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: REGISTER_MUTATION, variables: { email, password: 'correct-horse-1' } },
    });
    const body = res.json() as GraphQLResponse<{ register: string }>;
    return body.data!.register;
  }

  async function registerAndGetCookie(): Promise<string> {
    const email = `${randomUUID()}@example.com`;
    const res = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: REGISTER_MUTATION, variables: { email, password: 'correct-horse-1' } },
    });
    const setCookie = res.headers['set-cookie'];
    const accessCookie = Array.isArray(setCookie)
      ? setCookie.find((cookie) => cookie.startsWith('trakwyn_access_token='))
      : setCookie;
    if (!accessCookie) throw new Error('Registration did not set an access cookie');
    return accessCookie.split(';', 1)[0];
  }

  async function createApiToken(accessToken: string, scope?: 'read' | 'full'): Promise<string> {
    const res = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        query: CREATE_API_TOKEN_MUTATION,
        variables: { name: 'MCP integration test token', scope },
      },
    });
    const body = res.json() as GraphQLResponse<{ createApiToken: { token: string } }>;
    return body.data!.createApiToken.token;
  }

  function mcpInject(apiToken: string | null, body: Record<string, unknown>) {
    return testApp.app.inject({
      method: 'POST',
      url: ROUTES.MCP,
      headers: apiToken ? { authorization: `Bearer ${apiToken}` } : undefined,
      payload: body,
    });
  }

  beforeAll(async () => {
    testApp = await buildTestApp();
  }, 30_000);

  afterAll(async () => {
    await testApp.cleanup();
  });

  it('rejects a request with no Authorization header', async () => {
    const res = await mcpInject(null, { jsonrpc: '2.0', id: 1, method: 'tools/list' });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: expect.stringContaining('Missing') });
    expect(res.headers['www-authenticate']).toContain('Bearer');
    expect(res.headers['www-authenticate']).toMatch(
      /resource_metadata="http:\/\/localhost:\d+\/.well-known\/oauth-protected-resource"/,
    );
  });

  it('rejects a request with an invalid/unknown API token', async () => {
    const res = await mcpInject('trakwyn_not-a-real-token', {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: expect.stringContaining('Invalid') });
  });

  it('publishes protected-resource metadata for MCP clients', async () => {
    const res = await testApp.app.inject({
      method: 'GET',
      url: '/.well-known/oauth-protected-resource',
      headers: { host: 'api.example.com', 'x-forwarded-proto': 'https' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      resource: 'https://api.example.com/mcp',
      authorization_servers: ['https://api.example.com'],
      scopes_supported: ['read', 'full'],
      bearer_methods_supported: ['header'],
    });
  });

  it('publishes authorization-server metadata for MCP clients', async () => {
    const res = await testApp.app.inject({
      method: 'GET',
      url: '/.well-known/oauth-authorization-server',
      headers: { host: 'api.example.com', 'x-forwarded-proto': 'https' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      issuer: 'https://api.example.com',
      authorization_endpoint: 'https://api.example.com/oauth/authorize',
      token_endpoint: 'https://api.example.com/oauth/token',
      revocation_endpoint: 'https://api.example.com/oauth/revoke',
      registration_endpoint: 'https://api.example.com/oauth/register',
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      scopes_supported: ['read', 'full'],
    });
  });

  it('registers an MCP client and exchanges a PKCE authorization code', async () => {
    const clientRes = await testApp.app.inject({
      method: 'POST',
      url: '/oauth/register',
      payload: {
        client_name: 'Test MCP Client',
        redirect_uris: ['http://localhost:6274/oauth/callback'],
      },
    });
    expect(clientRes.statusCode).toBe(201);
    const client = clientRes.json() as { client_id: string };
    const cookie = await registerAndGetCookie();
    const codeVerifier = 'test-code-verifier';
    const { createHash } = await import('node:crypto');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

    const approvalRes = await testApp.app.inject({
      method: 'POST',
      url: '/oauth/authorize/approve',
      headers: { cookie },
      payload: {
        client_id: client.client_id,
        redirect_uri: 'http://localhost:6274/oauth/callback',
        response_type: 'code',
        scope: 'read',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: 'state-1',
        approved: true,
      },
    });
    expect(approvalRes.statusCode).toBe(200);
    const redirectTo = (approvalRes.json() as { redirect_to: string }).redirect_to;
    const authorizationCode = new URL(redirectTo).searchParams.get('code');
    expect(authorizationCode).toBeTruthy();

    const tokenRes = await testApp.app.inject({
      method: 'POST',
      url: '/oauth/token',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode!,
        client_id: client.client_id,
        redirect_uri: 'http://localhost:6274/oauth/callback',
        code_verifier: codeVerifier,
      }).toString(),
    });
    expect(tokenRes.statusCode).toBe(200);
    const token = tokenRes.json() as {
      access_token: string;
      refresh_token: string;
      token_type: string;
      scope: string;
    };
    expect(token).toMatchObject({ token_type: 'Bearer', scope: 'read' });
    expect(token.refresh_token).toMatch(/^trakwyn_mcp_refresh_/);

    const mcpRes = await mcpInject(token.access_token, {
      jsonrpc: '2.0',
      id: 100,
      method: 'tools/list',
    });
    expect(mcpRes.statusCode).toBe(200);

    const refreshedRes = await testApp.app.inject({
      method: 'POST',
      url: '/oauth/token',
      payload: {
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
        client_id: client.client_id,
      },
    });
    expect(refreshedRes.statusCode).toBe(200);
    const refreshed = refreshedRes.json() as { access_token: string; refresh_token: string };
    expect(refreshed.access_token).not.toBe(token.access_token);
    expect(refreshed.refresh_token).not.toBe(token.refresh_token);

    const reusedRes = await testApp.app.inject({
      method: 'POST',
      url: '/oauth/token',
      payload: {
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
        client_id: client.client_id,
      },
    });
    expect(reusedRes.statusCode).toBe(400);

    const revokeRes = await testApp.app.inject({
      method: 'POST',
      url: '/oauth/revoke',
      payload: { token: token.access_token },
    });
    expect(revokeRes.statusCode).toBe(200);

    const revokedMcpRes = await mcpInject(token.access_token, {
      jsonrpc: '2.0',
      id: 101,
      method: 'tools/list',
    });
    expect(revokedMcpRes.statusCode).toBe(401);
  });

  it('rejects a bearer credential that is not an API token (e.g. a JWT)', async () => {
    const accessToken = await registerAndGetAccessToken();

    const res = await mcpInject(accessToken, { jsonrpc: '2.0', id: 1, method: 'tools/list' });

    expect(res.statusCode).toBe(401);
  });

  it('returns 400 for a malformed JSON-RPC envelope', async () => {
    const accessToken = await registerAndGetAccessToken();
    const apiToken = await createApiToken(accessToken);

    const res = await mcpInject(apiToken, { id: 1, method: 'tools/list' });

    expect(res.statusCode).toBe(400);
    const body = res.json() as JsonRpcResponse;
    expect(body.error?.message).toBe('Invalid Request');
  });

  it('lists the advertised tool catalogue via tools/list', async () => {
    const accessToken = await registerAndGetAccessToken();
    const apiToken = await createApiToken(accessToken);

    const res = await mcpInject(apiToken, { jsonrpc: '2.0', id: 42, method: 'tools/list' });

    expect(res.statusCode).toBe(200);
    const body = res.json() as JsonRpcResponse & { result: { tools: Array<{ name: string }> } };
    expect(body.id).toBe(42);
    const toolNames = body.result.tools.map((t) => t.name);
    expect(toolNames).toEqual(
      expect.arrayContaining(['list_applications', 'get_application', 'list_notes']),
    );
  });

  it('round-trips a tools/call for list_applications scoped to the authenticated user', async () => {
    const accessToken = await registerAndGetAccessToken();
    const apiToken = await createApiToken(accessToken);

    const createRes = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        query: CREATE_APPLICATION_MUTATION,
        variables: { input: { company: 'Acme Corp', role: 'Staff Engineer', status: 'applied' } },
      },
    });
    const createBody = createRes.json() as GraphQLResponse<{
      createApplication: { id: string; company: string };
    }>;
    expect(createBody.errors).toBeUndefined();

    const res = await mcpInject(apiToken, {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: { name: 'list_applications', arguments: {} },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as JsonRpcResponse & {
      result: { content: Array<{ type: string; text: string }> };
    };
    expect(body.id).toBe(7);
    // list_applications returns a page envelope (JEF-172), not a bare array,
    // so a client can follow nextCursor rather than receiving everything.
    const page = JSON.parse(body.result.content[0].text) as {
      items: Array<{ company: string }>;
      hasNextPage: boolean;
      nextCursor: string | null;
    };
    expect(page.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ company: 'Acme Corp' })]),
    );
    expect(page).toMatchObject({ hasNextPage: false, nextCursor: null });
  });

  it('bounds list_applications by limit and hands back a usable cursor', async () => {
    const accessToken = await registerAndGetAccessToken();
    const apiToken = await createApiToken(accessToken);

    for (const company of ['Acme', 'Globex', 'Initech']) {
      await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          query: CREATE_APPLICATION_MUTATION,
          variables: { input: { company, role: 'Engineer', status: 'applied' } },
        },
      });
    }

    const res = await mcpInject(apiToken, {
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: { name: 'list_applications', arguments: { limit: 2 } },
    });

    const body = res.json() as JsonRpcResponse & {
      result: { content: Array<{ text: string }> };
    };
    const page = JSON.parse(body.result.content[0].text) as {
      items: unknown[];
      hasNextPage: boolean;
      nextCursor: string | null;
    };

    expect(page.items).toHaveLength(2);
    expect(page.hasNextPage).toBe(true);
    expect(page.nextCursor).toEqual(expect.any(String));
  });

  describe('write tools and token scope (JEF-176)', () => {
    it('refuses a write tool for a genuinely read-scoped token, end to end', async () => {
      const accessToken = await registerAndGetAccessToken();
      const readToken = await createApiToken(accessToken, 'read');

      const res = await mcpInject(readToken, {
        jsonrpc: '2.0',
        id: 20,
        method: 'tools/call',
        params: {
          name: 'create_application',
          arguments: { company: 'Acme', role: 'Engineer' },
        },
      });

      const body = res.json() as JsonRpcResponse;
      expect(body.error?.message).toMatch(/read-only/);

      // And nothing was created: the read token can still list, and sees none.
      const listRes = await mcpInject(readToken, {
        jsonrpc: '2.0',
        id: 21,
        method: 'tools/call',
        params: { name: 'list_applications', arguments: {} },
      });
      const listBody = listRes.json() as JsonRpcResponse & {
        result: { content: Array<{ text: string }> };
      };
      const page = JSON.parse(listBody.result.content[0].text) as { items: unknown[] };
      expect(page.items).toHaveLength(0);
    });

    it('allows a write tool for a full-scoped token and actually persists', async () => {
      const accessToken = await registerAndGetAccessToken();
      const fullToken = await createApiToken(accessToken, 'full');

      const res = await mcpInject(fullToken, {
        jsonrpc: '2.0',
        id: 22,
        method: 'tools/call',
        params: {
          name: 'create_application',
          arguments: { company: 'Globex', role: 'Staff Engineer' },
        },
      });
      const body = res.json() as JsonRpcResponse;
      expect(body.error).toBeUndefined();

      const listRes = await mcpInject(fullToken, {
        jsonrpc: '2.0',
        id: 23,
        method: 'tools/call',
        params: { name: 'list_applications', arguments: {} },
      });
      const listBody = listRes.json() as JsonRpcResponse & {
        result: { content: Array<{ text: string }> };
      };
      const page = JSON.parse(listBody.result.content[0].text) as {
        items: Array<{ company: string }>;
      };
      expect(page.items).toEqual(
        expect.arrayContaining([expect.objectContaining({ company: 'Globex' })]),
      );
    });

    it('hides write tools from a read token in tools/list', async () => {
      const accessToken = await registerAndGetAccessToken();
      const readToken = await createApiToken(accessToken, 'read');

      const res = await mcpInject(readToken, { jsonrpc: '2.0', id: 24, method: 'tools/list' });
      const body = res.json() as JsonRpcResponse & {
        result: { tools: Array<{ name: string }> };
      };
      const names = body.result.tools.map((t) => t.name);

      expect(names).toContain('list_applications');
      expect(names).not.toContain('create_application');
      // `access` is internal and must not leak over the wire.
      expect(body.result.tools.every((t) => !('access' in t))).toBe(true);
    });
  });

  it('returns an INVALID_PARAMS error for get_application with no applicationId', async () => {
    const accessToken = await registerAndGetAccessToken();
    const apiToken = await createApiToken(accessToken);

    const res = await mcpInject(apiToken, {
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: { name: 'get_application', arguments: {} },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as JsonRpcResponse;
    expect(body.error).toEqual(
      expect.objectContaining({ message: expect.stringContaining('applicationId is required') }),
    );
  });

  it('returns a METHOD_NOT_FOUND error for an unknown tool', async () => {
    const accessToken = await registerAndGetAccessToken();
    const apiToken = await createApiToken(accessToken);

    const res = await mcpInject(apiToken, {
      jsonrpc: '2.0',
      id: 9,
      method: 'tools/call',
      params: { name: 'not_a_real_tool', arguments: {} },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as JsonRpcResponse;
    expect(body.error?.message).toContain('Unknown tool');
  });
});
