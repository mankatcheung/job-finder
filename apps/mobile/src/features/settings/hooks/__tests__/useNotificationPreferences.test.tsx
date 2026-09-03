import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../useNotificationPreferences';
import type { NotificationPreferences } from '../../types';

const mockedGqlRequest = jest.mocked(gqlRequest);

const preferences: NotificationPreferences = {
  digestFrequency: 'WEEKLY',
  followUpRemindersEnabled: true,
  pushNotificationsEnabled: false,
  weeklyApplicationGoal: 5,
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useNotificationPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches preferences', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ notificationPreferences: preferences });

    const { result } = await renderHook(() => useNotificationPreferences(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(preferences);
  });

  it('updates preferences', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ updateNotificationPreferences: true });
    const { result } = await renderHook(() => useUpdateNotificationPreferences(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ digestFrequency: 'OFF' });
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), { digestFrequency: 'OFF' });
  });
});
