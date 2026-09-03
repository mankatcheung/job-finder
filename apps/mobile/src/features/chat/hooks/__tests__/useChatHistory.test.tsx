import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import { chatHistoryQueryKey, useAppendOptimisticMessage, useChatHistory } from '../useChatHistory';
import type { ChatMessage } from '../../types';

const mockedGqlRequest = jest.mocked(gqlRequest);

const message: ChatMessage = {
  id: '1',
  role: 'assistant',
  content: 'Hello!',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useChatHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches history for a conversation', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ chatHistory: [message] });

    const { result } = await renderHook(() => useChatHistory('conv-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([message]);
  });

  it('does not fetch when there is no conversation yet', async () => {
    const { result } = await renderHook(() => useChatHistory(null), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedGqlRequest).not.toHaveBeenCalled();
  });

  it('appends an optimistic message to the cache', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = await renderHook(() => useAppendOptimisticMessage(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    result.current('conv-1', message);

    expect(queryClient.getQueryData(chatHistoryQueryKey('conv-1'))).toEqual([message]);
  });
});
