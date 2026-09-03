import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import { useProfile, useUpdateProfile } from '../useProfile';
import type { Profile } from '../../types';

const mockedGqlRequest = jest.mocked(gqlRequest);

const profile: Profile = {
  id: '1',
  email: 'demo@trakwyn.app',
  name: 'Demo User',
  timezone: 'Europe/London',
  targetRole: 'Senior Engineer',
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the profile', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ me: profile });

    const { result } = await renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(profile);
  });

  it('updates the profile', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ updateProfile: true });
    const { result } = await renderHook(() => useUpdateProfile(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: 'New Name' });
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), { name: 'New Name' });
  });
});
