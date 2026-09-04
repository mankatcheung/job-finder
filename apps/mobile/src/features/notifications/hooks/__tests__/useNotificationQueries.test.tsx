import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import { useNotificationsPage, useUnreadNotificationCount } from '../useNotificationQueries';

const mockedGqlRequest = jest.mocked(gqlRequest);

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useNotificationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the first page of notifications', async () => {
    mockedGqlRequest.mockResolvedValueOnce({
      notificationsPage: {
        hasNextPage: false,
        nextCursor: null,
        items: [
          {
            id: '1',
            type: 'interview_reminder',
            title: 'Upcoming interview',
            body: 'Stripe',
            url: '/applications/1',
            read: false,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    });

    const { result } = await renderHook(() => useNotificationsPage(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].items).toHaveLength(1);
    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), {
      cursor: undefined,
      limit: 20,
    });
  });
});

describe('useUnreadNotificationCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the unread count', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ unreadNotificationCount: 3 });

    const { result } = await renderHook(() => useUnreadNotificationCount(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(3);
  });
});
