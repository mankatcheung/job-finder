export interface AuthState {
  token: string;
  expiresAt: number;
}

export async function getAuth(): Promise<AuthState | null> {
  const result = await chrome.storage.session.get('auth');
  const auth = result.auth as AuthState | undefined;
  if (!auth) return null;
  if (Date.now() > auth.expiresAt) {
    await chrome.storage.session.remove('auth');
    return null;
  }
  return auth;
}

export async function setAuth(auth: AuthState): Promise<void> {
  await chrome.storage.session.set({ auth });
}

export async function clearAuth(): Promise<void> {
  await chrome.storage.session.remove('auth');
}

export async function getApiUrl(): Promise<string> {
  const result = await chrome.storage.sync.get({ apiUrl: 'http://localhost:3001/graphql' });
  return result.apiUrl as string;
}

export async function setApiUrl(apiUrl: string): Promise<void> {
  await chrome.storage.sync.set({ apiUrl });
}
