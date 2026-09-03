import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';

jest.mock('../tokenStorage', () => ({
  getTokens: jest.fn(),
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
}));

jest.mock('../../graphql/client', () => ({
  gqlRequest: jest.fn(),
  setAccessToken: jest.fn(),
  onSessionExpired: jest.fn(() => () => {}),
}));

import { getTokens, setTokens, clearTokens } from '../tokenStorage';
import { gqlRequest, setAccessToken, onSessionExpired } from '../../graphql/client';
import { AuthProvider, useAuth } from '../AuthContext';

const mockedGetTokens = jest.mocked(getTokens);
const mockedSetTokens = jest.mocked(setTokens);
const mockedClearTokens = jest.mocked(clearTokens);
const mockedGqlRequest = jest.mocked(gqlRequest);
const mockedSetAccessToken = jest.mocked(setAccessToken);
const mockedOnSessionExpired = jest.mocked(onSessionExpired);

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedOnSessionExpired.mockReturnValue(() => {});
  });

  it('starts unauthenticated when no tokens are stored', async () => {
    mockedGetTokens.mockResolvedValueOnce(null);

    const { result } = await renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('starts authenticated and restores the access token when tokens are stored', async () => {
    mockedGetTokens.mockResolvedValueOnce({
      accessToken: 'stored-access',
      refreshToken: 'stored-refresh',
    });

    const { result } = await renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(mockedSetAccessToken).toHaveBeenCalledWith('stored-access');
  });

  it('logs in and stores the returned tokens', async () => {
    mockedGetTokens.mockResolvedValueOnce(null);
    mockedGqlRequest.mockResolvedValueOnce({
      loginMobile: {
        success: true,
        totpRequired: false,
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
      },
    });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome: { totpRequired: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.login('a@example.com', 'password123');
    });

    expect(outcome).toEqual({ totpRequired: false });
    expect(mockedSetTokens).toHaveBeenCalledWith({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('reports totpRequired without storing tokens when TOTP is required', async () => {
    mockedGetTokens.mockResolvedValueOnce(null);
    mockedGqlRequest.mockResolvedValueOnce({
      loginMobile: { success: false, totpRequired: true, accessToken: null, refreshToken: null },
    });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome: { totpRequired: boolean } | undefined;
    await act(async () => {
      outcome = await result.current.login('a@example.com', 'password123');
    });

    expect(outcome).toEqual({ totpRequired: true });
    expect(mockedSetTokens).not.toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('clears tokens and flips to unauthenticated on logout', async () => {
    mockedGetTokens.mockResolvedValueOnce({
      accessToken: 'stored-access',
      refreshToken: 'stored-refresh',
    });
    mockedGqlRequest.mockResolvedValueOnce({ logout: true });

    const { result } = await renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(mockedClearTokens).toHaveBeenCalled();
    expect(mockedSetAccessToken).toHaveBeenCalledWith(null);
    expect(result.current.isAuthenticated).toBe(false);
  });
});
