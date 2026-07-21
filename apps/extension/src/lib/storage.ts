import { DEFAULT_API_URL, STORAGE_KEYS } from '../constants';

export interface AuthState {
  token: string;
  expiresAt: number;
}

export async function getAuth(): Promise<AuthState | null> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.AUTH);
  const auth = result[STORAGE_KEYS.AUTH] as AuthState | undefined;
  if (!auth) return null;
  if (Date.now() > auth.expiresAt) {
    await chrome.storage.session.remove(STORAGE_KEYS.AUTH);
    return null;
  }
  return auth;
}

export async function setAuth(auth: AuthState): Promise<void> {
  await chrome.storage.session.set({ [STORAGE_KEYS.AUTH]: auth });
}

export async function clearAuth(): Promise<void> {
  await chrome.storage.session.remove(STORAGE_KEYS.AUTH);
}

export async function getApiUrl(): Promise<string> {
  const result = await chrome.storage.sync.get({ [STORAGE_KEYS.API_URL]: DEFAULT_API_URL });
  return result[STORAGE_KEYS.API_URL] as string;
}

export async function setApiUrl(apiUrl: string): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.API_URL]: apiUrl });
}
