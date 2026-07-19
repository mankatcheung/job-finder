import { getAuth, setAuth, clearAuth, getApiUrl } from './storage';

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  jobUrl?: string;
  description?: string;
  source?: string;
}

async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<T> {
  const apiUrl = await getApiUrl();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error('No data returned');
  return json.data;
}

async function authedGql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const auth = await getAuth();
  if (!auth) throw new Error('Not authenticated');
  return gql<T>(query, variables, auth.token);
}

const LOGIN = `mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) }`;
const REFRESH = `mutation { refreshToken }`;
const CREATE_APPLICATION = `
  mutation CreateApplication($input: CreateApplicationInput!) {
    createApplication(input: $input) { id company role status }
  }
`;

export async function login(email: string, password: string): Promise<void> {
  const apiUrl = await getApiUrl();

  // Call login — sets HttpOnly cookies for the API origin
  await gql<{ login: boolean }>(LOGIN, { email, password });

  // Read the access token from the cookie jar (requires `cookies` permission)
  const cookie = await chrome.cookies.get({ url: apiUrl, name: 'jf_access_token' });
  if (!cookie) throw new Error('Login succeeded but no token cookie found');

  // Decode the JWT to get its expiry (payload is base64 URL-encoded)
  const [, payload] = cookie.value.split('.');
  const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp: number };

  await setAuth({ token: cookie.value, expiresAt: exp * 1000 });
}

export async function logout(): Promise<void> {
  await clearAuth();
}

export async function refreshToken(): Promise<boolean> {
  try {
    const apiUrl = await getApiUrl();
    await gql<{ refreshToken: boolean }>(REFRESH);
    const cookie = await chrome.cookies.get({ url: apiUrl, name: 'jf_access_token' });
    if (!cookie) return false;

    const [, payload] = cookie.value.split('.');
    const { exp } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp: number };
    await setAuth({ token: cookie.value, expiresAt: exp * 1000 });
    return true;
  } catch {
    await clearAuth();
    return false;
  }
}

export async function createApplication(input: {
  company: string;
  role: string;
  jobUrl?: string;
  description?: string;
  source?: string;
}): Promise<JobApplication> {
  const data = await authedGql<{ createApplication: JobApplication }>(CREATE_APPLICATION, { input });
  return data.createApplication;
}
