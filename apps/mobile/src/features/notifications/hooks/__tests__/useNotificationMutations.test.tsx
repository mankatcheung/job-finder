import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import { useMarkNotificationsRead } from '../useNotificationMutations';

const mockedGqlRequest = jest.mocked(gqlRequest);

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useMarkNotificationsRead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('marks the given ids read', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ markNotificationsRead: true });
    const { result } = await renderHook(() => useMarkNotificationsRead(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ ids: ['1', '2'], isRead: true });
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), {
      ids: ['1', '2'],
      isRead: true,
    });
  });
});
