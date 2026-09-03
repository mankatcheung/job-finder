import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import { useDeleteDocument } from '../useDeleteDocument';

const mockedGqlRequest = jest.mocked(gqlRequest);

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useDeleteDocument', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a document', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ deleteDocument: true });
    const { result } = await renderHook(() => useDeleteDocument('app-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('1');
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), { id: '1' });
  });
});
