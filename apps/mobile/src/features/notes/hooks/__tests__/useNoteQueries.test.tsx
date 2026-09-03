import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import { useNotes } from '../useNoteQueries';
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

describe('useNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches notes for an application', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ notes: [note] });

    const { result } = await renderHook(() => useNotes('app-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([note]);
    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), { applicationId: 'app-1' });
  });

  it('does not fetch when the application id is empty', async () => {
    const { result } = await renderHook(() => useNotes(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedGqlRequest).not.toHaveBeenCalled();
  });
});
