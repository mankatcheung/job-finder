import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import { useCreateNote, useDeleteNote, useUpdateNote } from '../useNoteMutations';
import type { Note } from '../../types';

const mockedGqlRequest = jest.mocked(gqlRequest);

const note: Note = {
  id: '1',
  applicationId: 'app-1',
  content: 'Follow up next week',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useNoteMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a note', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ createNote: note });
    const { result } = await renderHook(() => useCreateNote('app-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('Follow up next week');
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), {
      applicationId: 'app-1',
      content: 'Follow up next week',
    });
  });

  it('updates a note', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ updateNote: note });
    const { result } = await renderHook(() => useUpdateNote('app-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: '1', content: 'Updated' });
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), {
      id: '1',
      content: 'Updated',
    });
  });

  it('deletes a note', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ deleteNote: true });
    const { result } = await renderHook(() => useDeleteNote('app-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('1');
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), { id: '1' });
  });
});
