import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

import { AnalyticsPage } from '#/routes/_authenticated/-analytics-page';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

const app = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'app-1',
  company: 'Acme',
  role: 'Engineer',
  status: 'applied',
  appliedAt: '2024-01-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an error state with a retry action when the query fails', async () => {
    mockGqlRequest.mockRejectedValue(new Error('Network error'));
    render(<AnalyticsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry|try again/i })).toBeInTheDocument();
    });
  });

  it('shows "No data yet." for both charts when there are no applications', async () => {
    mockGqlRequest.mockResolvedValue({ applications: [] });
    render(<AnalyticsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
    expect(screen.getAllByText('No data yet.')).toHaveLength(2);
    expect(screen.getByText('Total').nextSibling).toHaveTextContent('0');
  });

  it('computes total, active, response rate, and offer rate from applications', async () => {
    mockGqlRequest.mockResolvedValue({
      applications: [
        app({ id: '1', status: 'draft' }),
        app({ id: '2', status: 'applied' }),
        app({ id: '3', status: 'interviewing' }),
        app({ id: '4', status: 'offered' }),
        app({ id: '5', status: 'accepted' }),
        app({ id: '6', status: 'rejected' }),
      ],
    });
    render(<AnalyticsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    // Total: 6, Active (applied/interviewing/offered): 3
    expect(screen.getByText('Total').parentElement).toHaveTextContent('6');
    expect(screen.getByText('Active').parentElement).toHaveTextContent('3');
    // appliedOrBeyond excludes draft (5), gotResponse excludes applied/draft (interviewing, offered, accepted, rejected = 4) => 80%
    expect(screen.getByText('Response rate').parentElement).toHaveTextContent('80%');
    // offer rate = accepted / total = 1/6 -> 17%
    expect(screen.getByText('Offer rate').parentElement).toHaveTextContent('17%');
  });

  it('renders chart section headings once data has loaded', async () => {
    mockGqlRequest.mockResolvedValue({ applications: [app()] });
    render(<AnalyticsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Applications per week')).toBeInTheDocument();
    });
    expect(screen.getByText('Stage funnel')).toBeInTheDocument();
  });
});
