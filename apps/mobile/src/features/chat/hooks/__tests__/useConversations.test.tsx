import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
} from '../useConversations';
import type { Conversation } from '../../types';

const mockedGqlRequest = jest.mocked(gqlRequest);

const conversation: Conversation = {
  id: '1',
  title: 'Stripe interview prep',
  llmProvider: 'openai',
  llmModel: 'gpt-4o-mini',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useConversations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches conversations', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ conversations: [conversation] });

    const { result } = await renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([conversation]);
  });

  it('creates a conversation', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ createConversation: conversation });
    const { result } = await renderHook(() => useCreateConversation(), { wrapper });

    let created: Conversation | undefined;
    await act(async () => {
      created = await result.current.mutateAsync({});
    });

    expect(created).toEqual(conversation);
  });

  it('deletes a conversation', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ deleteConversation: true });
    const { result } = await renderHook(() => useDeleteConversation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('1');
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), { id: '1' });
  });
});
