import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import { useDocuments } from '../useDocumentQueries';
import type { Document } from '../../types';

const mockedGqlRequest = jest.mocked(gqlRequest);

const document: Document = {
  id: '1',
  applicationId: 'app-1',
  name: 'resume.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 1024,
  url: 'https://example.com/resume.pdf',
  documentType: 'resume',
  version: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches documents for an application', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ documents: [document] });

    const { result } = await renderHook(() => useDocuments('app-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([document]);
  });

  it('does not fetch when the application id is empty', async () => {
    const { result } = await renderHook(() => useDocuments(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedGqlRequest).not.toHaveBeenCalled();
  });
});
