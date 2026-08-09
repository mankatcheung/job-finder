import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { buildTestApp, type TestApp } from './helpers/buildTestApp.js';

const REGISTER_MUTATION = `
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password)
  }
`;

const CREATE_APPLICATION_MUTATION = `
  mutation CreateApplication($input: CreateApplicationInput!) {
    createApplication(input: $input) {
      id
      company
      role
      status
      starred
    }
  }
`;

const APPLICATION_QUERY = `
  query Application($id: ID!) {
    application(id: $id) {
      id
      company
      role
      status
    }
  }
`;

const APPLICATIONS_QUERY = `
  query Applications {
    applications {
      id
      company
    }
  }
`;

const UPDATE_APPLICATION_MUTATION = `
  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
    updateApplication(id: $id, input: $input) {
      id
      status
      starred
    }
  }
`;

const DELETE_APPLICATION_MUTATION = `
  mutation DeleteApplication($id: ID!) {
    deleteApplication(id: $id)
  }
`;

interface GraphQLResponse<T> {
  data: T | null;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

describe('applications integration', () => {
  let testApp: TestApp;

  async function registerAndLogin(): Promise<string> {
    const email = `${randomUUID()}@example.com`;
    const res = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: REGISTER_MUTATION, variables: { email, password: 'correct-horse-1' } },
    });
    const body = res.json() as GraphQLResponse<{ register: string }>;
    return body.data!.register;
  }

  function authedInject(token: string, query: string, variables?: Record<string, unknown>) {
    return testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { authorization: `Bearer ${token}` },
      payload: { query, variables },
    });
  }

  beforeAll(async () => {
    testApp = await buildTestApp();
  }, 30_000);

  afterAll(async () => {
    await testApp.cleanup();
  });

  it('runs the full create → query → update → delete lifecycle through real mutations/queries', async () => {
    const token = await registerAndLogin();

    const createRes = await authedInject(token, CREATE_APPLICATION_MUTATION, {
      input: { company: 'Acme Corp', role: 'Staff Engineer', status: 'applied' },
    });
    const createBody = createRes.json() as GraphQLResponse<{
      createApplication: { id: string; company: string; role: string; status: string };
    }>;
    expect(createBody.errors).toBeUndefined();
    const app = createBody.data!.createApplication;
    expect(app).toMatchObject({ company: 'Acme Corp', role: 'Staff Engineer', status: 'applied' });

    const listRes = await authedInject(token, APPLICATIONS_QUERY);
    const listBody = listRes.json() as GraphQLResponse<{
      applications: Array<{ id: string; company: string }>;
    }>;
    expect(listBody.data!.applications.map((a) => a.id)).toContain(app.id);

    const getRes = await authedInject(token, APPLICATION_QUERY, { id: app.id });
    const getBody = getRes.json() as GraphQLResponse<{
      application: { id: string; company: string; role: string; status: string };
    }>;
    expect(getBody.data!.application).toMatchObject({ id: app.id, company: 'Acme Corp' });

    const updateRes = await authedInject(token, UPDATE_APPLICATION_MUTATION, {
      id: app.id,
      input: { status: 'interviewing', starred: true },
    });
    const updateBody = updateRes.json() as GraphQLResponse<{
      updateApplication: { id: string; status: string; starred: boolean };
    }>;
    expect(updateBody.data!.updateApplication).toEqual({
      id: app.id,
      status: 'interviewing',
      starred: true,
    });

    const deleteRes = await authedInject(token, DELETE_APPLICATION_MUTATION, { id: app.id });
    const deleteBody = deleteRes.json() as GraphQLResponse<{ deleteApplication: boolean }>;
    expect(deleteBody.data!.deleteApplication).toBe(true);

    const afterDeleteRes = await authedInject(token, APPLICATION_QUERY, { id: app.id });
    const afterDeleteBody = afterDeleteRes.json() as GraphQLResponse<{ application: null }>;
    expect(afterDeleteBody.data).toEqual({ application: null });
    expect(afterDeleteBody.errors?.[0]?.extensions?.code).toBe('NOT_FOUND');
  });

  it('rejects createApplication with no Authorization header', async () => {
    const res = await testApp.app.inject({
      method: 'POST',
      url: '/graphql',
      payload: {
        query: CREATE_APPLICATION_MUTATION,
        variables: { input: { company: 'Acme', role: 'Engineer' } },
      },
    });
    const body = res.json() as GraphQLResponse<{ createApplication: null }>;
    expect(body.data).toEqual({ createApplication: null });
    expect(body.errors?.[0]?.extensions?.code).toBe('UNAUTHORIZED');
  });

  it("forbids one user from reading another user's application", async () => {
    const ownerToken = await registerAndLogin();
    const otherToken = await registerAndLogin();

    const createRes = await authedInject(ownerToken, CREATE_APPLICATION_MUTATION, {
      input: { company: 'Private Co', role: 'Engineer' },
    });
    const createBody = createRes.json() as GraphQLResponse<{ createApplication: { id: string } }>;
    const appId = createBody.data!.createApplication.id;

    const getRes = await authedInject(otherToken, APPLICATION_QUERY, { id: appId });
    const getBody = getRes.json() as GraphQLResponse<{ application: null }>;
    expect(getBody.data).toEqual({ application: null });
    expect(getBody.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
  });
});
