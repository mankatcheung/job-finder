import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import {
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
  useUpdatePassword,
} from '../useSessions';
import type { Session } from '../../types';

const mockedGqlRequest = jest.mocked(gqlRequest);

const session: Session = {
  id: '1',
  userAgent: 'iOS App',
  ipAddress: '1.2.3.4',
  deviceLabel: "Jeff's iPhone",
  location: 'London, UK',
  lastUsedAt: '2026-01-01T00:00:00.000Z',
  current: true,
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useSessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches sessions', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ sessions: [session] });

    const { result } = await renderHook(() => useSessions(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([session]);
  });

  it('revokes a session', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ revokeSession: true });
    const { result } = await renderHook(() => useRevokeSession(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('1');
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), { id: '1' });
  });

  it('revokes other sessions', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ revokeOtherSessions: true });
    const { result } = await renderHook(() => useRevokeOtherSessions(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String));
  });

  it('updates the password', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ updatePassword: true });
    const { result } = await renderHook(() => useUpdatePassword(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ currentPassword: 'old', newPassword: 'new-password-1' });
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), {
      currentPassword: 'old',
      newPassword: 'new-password-1',
    });
  });
});
