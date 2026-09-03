import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import {
  useAnalyticsApplications,
  useApplicationChannelAnalytics,
  useDocumentVersionOutcomes,
  useInterviewRoundAnalytics,
  useOfferAnalytics,
  useResponseTimeAnalytics,
} from '../useAnalyticsQueries';

const mockedGqlRequest = jest.mocked(gqlRequest);

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

async function expectSuccess<T>(hook: () => { data?: T; isSuccess: boolean }) {
  const { result } = await renderHook(hook, { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  return result.current.data;
}

describe('useAnalyticsQueries', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches analytics applications', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ applications: [{ id: '1' }] });
    const data = await expectSuccess(useAnalyticsApplications);
    expect(data).toEqual([{ id: '1' }]);
  });

  it('fetches document version outcomes', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ documentVersionOutcomes: [] });
    const data = await expectSuccess(useDocumentVersionOutcomes);
    expect(data).toEqual([]);
  });

  it('fetches interview round analytics', async () => {
    mockedGqlRequest.mockResolvedValueOnce({
      interviewRoundAnalytics: { byType: [], roundsToOffer: {}, roundsToRejection: {} },
    });
    const data = await expectSuccess(useInterviewRoundAnalytics);
    expect(data?.byType).toEqual([]);
  });

  it('fetches offer analytics', async () => {
    mockedGqlRequest.mockResolvedValueOnce({ offerAnalytics: { trend: [], byCurrency: [] } });
    const data = await expectSuccess(useOfferAnalytics);
    expect(data?.trend).toEqual([]);
  });

  it('fetches application channel analytics', async () => {
    mockedGqlRequest.mockResolvedValueOnce({
      applicationChannelAnalytics: { bySource: [], byTag: [] },
    });
    const data = await expectSuccess(useApplicationChannelAnalytics);
    expect(data?.bySource).toEqual([]);
  });

  it('fetches response time analytics', async () => {
    mockedGqlRequest.mockResolvedValueOnce({
      responseTimeAnalytics: { timeInStage: [], timeToFirstResponse: {} },
    });
    const data = await expectSuccess(useResponseTimeAnalytics);
    expect(data?.timeInStage).toEqual([]);
  });
});
