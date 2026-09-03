import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getTokens, setTokens, clearTokens } from '../tokenStorage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockedSecureStore = jest.mocked(SecureStore);

describe('tokenStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('on web', () => {
    const store = new Map<string, string>();
    const fakeLocalStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    };

    beforeEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
      Object.defineProperty(globalThis, 'localStorage', {
        value: fakeLocalStorage,
        configurable: true,
      });
      store.clear();
    });

    afterEach(() => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    });

    it('reads and writes tokens via localStorage instead of SecureStore', async () => {
      await setTokens({ accessToken: 'a', refreshToken: 'r' });

      expect(mockedSecureStore.setItemAsync).not.toHaveBeenCalled();
      await expect(getTokens()).resolves.toEqual({ accessToken: 'a', refreshToken: 'r' });

      await clearTokens();

      expect(mockedSecureStore.deleteItemAsync).not.toHaveBeenCalled();
      await expect(getTokens()).resolves.toBeNull();
    });
  });

  it('returns null when either token is missing', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce('access-token');
    mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);

    await expect(getTokens()).resolves.toBeNull();
  });

  it('returns both tokens when present', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce('access-token');
    mockedSecureStore.getItemAsync.mockResolvedValueOnce('refresh-token');

    await expect(getTokens()).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('writes both tokens to secure storage', async () => {
    await setTokens({ accessToken: 'a', refreshToken: 'r' });

    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('trakwyn_access_token', 'a');
    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith('trakwyn_refresh_token', 'r');
  });

  it('deletes both tokens from secure storage', async () => {
    await clearTokens();

    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('trakwyn_access_token');
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith('trakwyn_refresh_token');
  });
});
