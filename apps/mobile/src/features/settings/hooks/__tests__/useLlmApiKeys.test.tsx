import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import {
  useDeleteLlmApiKey,
  useLlmApiKeys,
  useSaveLlmApiKey,
  useSetDefaultLlmProvider,
  useTestLlmApiKey,
} from '../useLlmApiKeys';
import type { LlmApiKey } from '../../types';

const mockedGqlRequest = jest.mocked(gqlRequest);

const key: LlmApiKey = { provider: 'openai', model: 'gpt-4o-mini', baseUrl: null };

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useLlmApiKeys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches keys and the default provider', async () => {
    mockedGqlRequest.mockResolvedValueOnce({
      llmApiKeys: [key],
      me: { defaultLlmProvider: 'openai' },
    });

    const { result } = await renderHook(() => useLlmApiKeys(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ keys: [key], defaultProvider: 'openai' });
  });

  it('saves a key', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ saveLlmApiKey: true });
    const { result } = await renderHook(() => useSaveLlmApiKey(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ provider: 'openai', apiKey: 'sk-test' });
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), {
      provider: 'openai',
      apiKey: 'sk-test',
    });
  });

  it('deletes a key', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ deleteLlmApiKey: true });
    const { result } = await renderHook(() => useDeleteLlmApiKey(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('openai');
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), { provider: 'openai' });
  });

  it('sets the default provider', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ setDefaultLlmProvider: true });
    const { result } = await renderHook(() => useSetDefaultLlmProvider(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('anthropic');
    });

    expect(mockedGqlRequest).toHaveBeenCalledWith(expect.any(String), { provider: 'anthropic' });
  });

  it('tests a key', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ testLlmApiKey: { ok: true, error: null } });
    const { result } = await renderHook(() => useTestLlmApiKey(), { wrapper });

    let outcome: { ok: boolean; error: string | null } | undefined;
    await act(async () => {
      outcome = await result.current.mutateAsync({ provider: 'openai', apiKey: 'sk-test' });
    });

    expect(outcome).toEqual({ ok: true, error: null });
  });
});
