import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import {
  useCreateApplication,
  useDeleteApplication,
  usePermanentlyDeleteApplication,
  useRestoreApplication,
  useUpdateApplication,
} from '../useApplicationMutations';
import type { Application } from '../../types';

const mockedGqlRequest = jest.mocked(gqlRequest);

const application: Application = {
  id: '1',
  company: 'Acme',
  role: 'Engineer',
  status: 'draft',
  jobUrl: null,
  location: null,
  salaryRange: null,
  description: null,
  appliedAt: null,
  starred: false,
  source: null,
  followUpAt: null,
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useApplicationMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an application', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ createApplication: application });
    const { result } = await renderHook(() => useCreateApplication(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ company: 'Acme', role: 'Engineer' });
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), {
      input: { company: 'Acme', role: 'Engineer' },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('updates an application', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ updateApplication: application });
    const { result } = await renderHook(() => useUpdateApplication(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: '1', input: { role: 'Senior Engineer' } });
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), {
      id: '1',
      input: { role: 'Senior Engineer' },
    });
  });

  it('deletes (trashes) an application', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ deleteApplication: true });
    const { result } = await renderHook(() => useDeleteApplication(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('1');
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), { id: '1' });
  });

  it('restores an application', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ restoreApplication: true });
    const { result } = await renderHook(() => useRestoreApplication(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('1');
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), { id: '1' });
  });

  it('permanently deletes an application', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ permanentlyDeleteApplication: true });
    const { result } = await renderHook(() => usePermanentlyDeleteApplication(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('1');
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), { id: '1' });
  });
});
