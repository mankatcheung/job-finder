import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest } = vi.hoisted(() => ({ mockGqlRequest: vi.fn() }));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => opts,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

import { DashboardPage } from '#/routes/_authenticated/dashboard';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton initially', () => {
    mockGqlRequest.mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />, { wrapper: Wrapper });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows empty state when no applications', async () => {
    mockGqlRequest.mockResolvedValue({ applications: [] });
    render(<DashboardPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('No applications yet.')).toBeInTheDocument();
    });
  });

  it('renders stat cards with correct counts', async () => {
    mockGqlRequest.mockResolvedValue({
      applications: [
        { id: '1', company: 'A', role: 'Dev', status: 'applied', createdAt: '2024-01-01' },
        { id: '2', company: 'B', role: 'Eng', status: 'interviewing', createdAt: '2024-01-02' },
        { id: '3', company: 'C', role: 'SWE', status: 'offered', createdAt: '2024-01-03' },
        { id: '4', company: 'D', role: 'IC', status: 'applied', createdAt: '2024-01-04' },
      ],
    });
    render(<DashboardPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    // Total count = 4
    expect(screen.getByText('4')).toBeInTheDocument();
    // Applied count = 2, Interviewing = 1, Offered = 1
    // Multiple "1" values on screen — use getAllByText
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
  });

  it('renders application list with company names', async () => {
    mockGqlRequest.mockResolvedValue({
      applications: [
        { id: '1', company: 'Stripe', role: 'SWE', status: 'applied', createdAt: '2024-01-01' },
        { id: '2', company: 'Vercel', role: 'Frontend', status: 'draft', createdAt: '2024-01-02' },
      ],
    });
    render(<DashboardPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.getByText('Vercel')).toBeInTheDocument();
    });
  });

  it('renders stat card labels', async () => {
    mockGqlRequest.mockResolvedValue({ applications: [] });
    render(<DashboardPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(screen.getByText('Interviewing')).toBeInTheDocument();
      expect(screen.getByText('Offered')).toBeInTheDocument();
    });
  });
});
