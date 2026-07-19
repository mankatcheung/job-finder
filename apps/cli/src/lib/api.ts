import { getAuth, saveAuth, clearAuth, getApiUrl, type AuthState } from './config.js';

export class AuthError extends Error {
  constructor() {
    super('Not authenticated. Run: jf auth login');
    this.name = 'AuthError';
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function decodeJwt(token: string): { sub: string; email: string; exp: number } {
  const payload = token.split('.')[1];
  if (!payload) throw new ApiError('Malformed token');
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8')) as {
    sub: string;
    email: string;
    exp: number;
  };
}

function parseCookies(headers: Headers): Record<string, string> {
  const cookies: Record<string, string> = {};
  const setCookieValues = headers.getSetCookie?.() ?? [];
  for (const raw of setCookieValues) {
    const [pair] = raw.split(';');
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const name = pair.slice(0, eqIdx).trim();
    const value = pair.slice(eqIdx + 1).trim();
    cookies[name] = value;
  }
  return cookies;
}

async function rawGql(
  query: string,
  variables: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
): Promise<{ data: Record<string, unknown>; headers: Headers }> {
  const apiUrl = getApiUrl();
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as {
    data?: Record<string, unknown>;
    errors?: { message: string; extensions?: { code?: string } }[];
  };

  if (json.errors?.length) {
    const first = json.errors[0];
    if (first.extensions?.code === 'UNAUTHORIZED') throw new AuthError();
    throw new ApiError(first.message);
  }

  return { data: json.data ?? {}, headers: response.headers };
}

async function getValidToken(): Promise<string> {
  let auth = getAuth();
  if (!auth) throw new AuthError();

  const twoMinutes = 2 * 60 * 1000;
  if (Date.now() < auth.expiresAt - twoMinutes) return auth.token;

  // Proactively refresh
  const { headers } = await rawGql(
    `mutation RefreshToken { refreshToken }`,
    {},
    { Cookie: `jf_refresh_token=${auth.refreshToken}` },
  );

  const cookies = parseCookies(headers);
  const accessToken = cookies['jf_access_token'];
  const refreshToken = cookies['jf_refresh_token'];
  if (!accessToken || !refreshToken) throw new AuthError();

  const payload = decodeJwt(accessToken);
  auth = { token: accessToken, refreshToken, expiresAt: payload.exp * 1000, email: auth.email };
  saveAuth(auth);
  return auth.token;
}

export async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const token = await getValidToken();
  const { data } = await rawGql(query, variables, { Authorization: `Bearer ${token}` });
  return data as T;
}

export async function login(email: string, password: string): Promise<AuthState> {
  const { headers } = await rawGql(
    `mutation Login($email: String!, $password: String!) { login(email: $email, password: $password) }`,
    { email, password },
  );

  const cookies = parseCookies(headers);
  const accessToken = cookies['jf_access_token'];
  const refreshToken = cookies['jf_refresh_token'];
  if (!accessToken || !refreshToken) throw new ApiError('Login failed: no tokens returned');

  const payload = decodeJwt(accessToken);
  const auth: AuthState = {
    token: accessToken,
    refreshToken,
    expiresAt: payload.exp * 1000,
    email,
  };
  saveAuth(auth);
  return auth;
}

export async function logout(): Promise<void> {
  try {
    const token = getAuth()?.token;
    if (token) {
      await rawGql(`mutation Logout { logout }`, {}, { Authorization: `Bearer ${token}` });
    }
  } catch {
    // Best-effort — always clear local state
  }
  clearAuth();
}
