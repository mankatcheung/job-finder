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
  mutation CreateApiToken($name: String!) {
    createApiToken(name: $name) {
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

  async function createApiToken(accessToken: string): Promise<string> {
    const res = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        query: CREATE_API_TOKEN_MUTATION,
        variables: { name: 'MCP integration test token' },
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
