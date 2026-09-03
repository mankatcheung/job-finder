import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import { useApplication, useApplications, useTrashedApplications } from '../useApplicationQueries';
import type { Application } from '../../types';

const mockedGqlRequest = jest.mocked(gqlRequest);

const application: Application = {
  id: '1',
  company: 'Acme',
  role: 'Engineer',
  status: 'applied',
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
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useApplicationQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches applications, passing the status filter through', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ applications: [application] });

    const { result } = await renderHook(() => useApplications('applied'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([application]);
    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), { status: 'applied' });
  });

  it('fetches a single application by id', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ application });

    const { result } = await renderHook(() => useApplication('1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(application);
  });

  it('does not fetch when the id is empty', async () => {
    const { result } = await renderHook(() => useApplication(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedGqlRequest).not.toHaveBeenCalled();
  });

  it('fetches trashed applications', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ trashedApplications: [application] });

    const { result } = await renderHook(() => useTrashedApplications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([application]);
  });
});
