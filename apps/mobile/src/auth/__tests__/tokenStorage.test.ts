import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getTokens, setTokens, clearTokens } from '../tokenStorage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockedSecureStore = jest.mocked(SecureStore);

const SESSION_KEY = 'trakwyn_session';
const pair = { accessToken: 'access-token', refreshToken: 'refresh-token' };

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

    it('reads and writes the pair via localStorage instead of SecureStore', async () => {
      await setTokens(pair);

      expect(mockedSecureStore.setItemAsync).not.toHaveBeenCalled();
      await expect(getTokens()).resolves.toEqual(pair);

      await clearTokens();

      expect(mockedSecureStore.deleteItemAsync).not.toHaveBeenCalled();
      await expect(getTokens()).resolves.toBeNull();
    });
  });

  it('writes the pair as a single entry, so it can never be half-updated', async () => {
    await setTokens(pair);

    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledTimes(1);
    expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(SESSION_KEY, JSON.stringify(pair));
  });

  it('reads the pair back', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify(pair));

    await expect(getTokens()).resolves.toEqual(pair);
    expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith(SESSION_KEY);
  });

  it('returns null when nothing is stored', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce(null);

    await expect(getTokens()).resolves.toBeNull();
    expect(mockedSecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('treats a corrupt entry as no session and removes it', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce('{not json');

    await expect(getTokens()).resolves.toBeNull();
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(SESSION_KEY);
  });

  it('treats an incomplete pair as no session and removes it', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({ accessToken: 'a' }));

    await expect(getTokens()).resolves.toBeNull();
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(SESSION_KEY);
  });

  it('propagates a SecureStore read failure to the caller', async () => {
    mockedSecureStore.getItemAsync.mockRejectedValueOnce(
      new Error("Could not decrypt the value for key 'trakwyn_session'"),
    );

    await expect(getTokens()).rejects.toThrow('Could not decrypt');
  });

  it('deletes the single entry', async () => {
    await clearTokens();

    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
    expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(SESSION_KEY);
  });
});
