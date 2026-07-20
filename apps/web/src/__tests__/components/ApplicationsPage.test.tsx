import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest, mockUseSearch } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
  mockUseSearch: vi.fn().mockReturnValue({}),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => ({
    ...opts,
    useSearch: mockUseSearch,
  }),
  Link: ({
    children,
    to,
    search,
  }: {
    children: React.ReactNode;
    to: string;
    search?: Record<string, string>;
  }) => <a href={to + (search ? '?' + new URLSearchParams(search).toString() : '')}>{children}</a>,
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

vi.mock('#/graphql/generated/graphql', () => ({}));

import { ApplicationsPage } from '#/routes/_authenticated/applications/index';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

describe('ApplicationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearch.mockReturnValue({});
  });

  it('shows empty state when no applications', async () => {
    mockGqlRequest.mockResolvedValue({ applications: [] });
    render(<ApplicationsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/No applications/)).toBeInTheDocument();
    });
  });

  it('renders application rows', async () => {
    mockGqlRequest.mockResolvedValue({
      applications: [
        {
          id: '1',
          company: 'Stripe',
          role: 'Engineer',
          status: 'applied',
          location: 'Remote',
          appliedAt: null,
          tags: [],
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          company: 'Vercel',
          role: 'Frontend',
          status: 'draft',
          location: null,
          appliedAt: null,
          tags: [],
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ],
    });
    render(<ApplicationsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.getByText('Vercel')).toBeInTheDocument();
    });
    expect(screen.getByText('Engineer · Remote')).toBeInTheDocument();
  });

  it('shows status filter chips', async () => {
    mockGqlRequest.mockResolvedValue({ applications: [] });
    render(<ApplicationsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });
    expect(screen.getByText('applied')).toBeInTheDocument();
    expect(screen.getByText('interviewing')).toBeInTheDocument();
  });

  it('shows filtered empty state when status filter active', async () => {
    mockUseSearch.mockReturnValue({ status: 'applied' });
    mockGqlRequest.mockResolvedValue({ applications: [] });
    render(<ApplicationsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/No applications with status "applied"/)).toBeInTheDocument();
    });
  });

  it('shows the page heading', async () => {
    mockGqlRequest.mockResolvedValue({ applications: [] });
    render(<ApplicationsPage />, { wrapper: Wrapper });

    expect(screen.getByText('Applications')).toBeInTheDocument();
  });
});
