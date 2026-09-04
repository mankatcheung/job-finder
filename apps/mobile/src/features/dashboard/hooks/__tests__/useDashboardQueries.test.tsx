import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../graphql/client', () => ({ gqlRequest: jest.fn() }));

import { gqlRequest } from '../../../../graphql/client';
import { useDashboardCalendarEvents, useWeeklyApplicationGoal } from '../useDashboardQueries';

const mockedGqlRequest = jest.mocked(gqlRequest);

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useDashboardCalendarEvents', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches calendar events', async () => {
    mockedGqlRequest.mockResolvedValueOnce({
      calendarEvents: [
        {
          id: '1',
          applicationId: 'app-1',
          company: 'Stripe',
          role: 'Engineer',
          type: 'interview',
          date: '2026-01-05T00:00:00.000Z',
          interviewRoundType: null,
        },
      ],
    });

    const { result } = await renderHook(() => useDashboardCalendarEvents(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});

describe('useWeeklyApplicationGoal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches the weekly goal', async () => {
    mockedGqlRequest.mockResolvedValueOnce({
      weeklyApplicationGoal: {
        weeklyApplicationGoal: 5,
        currentWeekCount: 2,
        currentWeekStart: '2026-01-01T00:00:00.000Z',
        streakWeeks: 3,
      },
    });

    const { result } = await renderHook(() => useWeeklyApplicationGoal(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.streakWeeks).toBe(3);
  });
});
