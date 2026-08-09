import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

import { KanbanBoard } from '#/routes/_authenticated/applications/-board-page';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

const app = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'app-1',
  company: 'Acme',
  role: 'Engineer',
  status: 'applied',
  location: 'Remote',
  appliedAt: '2024-01-01T00:00:00.000Z',
  starred: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  likelyGhosted: false,
  ...overrides,
});

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an error state with a retry action when the query fails', async () => {
    mockGqlRequest.mockRejectedValue(new Error('Network error'));
    render(<KanbanBoard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  it('renders all status columns with zero counts when there are no applications', async () => {
    mockGqlRequest.mockResolvedValue({ applications: [] });
    render(<KanbanBoard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('draft')).toBeInTheDocument();
    });
    for (const status of [
      'draft',
      'applied',
      'interviewing',
      'offered',
      'accepted',
      'rejected',
      'withdrawn',
    ]) {
      expect(screen.getByText(status)).toBeInTheDocument();
    }
  });

  it('places each application card into its matching status column', async () => {
    mockGqlRequest.mockResolvedValue({
      applications: [
        app({ id: '1', company: 'Acme', status: 'applied' }),
        app({ id: '2', company: 'Globex', status: 'interviewing' }),
      ],
    });
    render(<KanbanBoard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Acme')).toBeInTheDocument();
    });
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('shows the "Likely ghosted" badge for a flagged application', async () => {
    mockGqlRequest.mockResolvedValue({
      applications: [app({ id: '1', likelyGhosted: true })],
    });
    render(<KanbanBoard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Likely ghosted')).toBeInTheDocument();
    });
  });

  it('links "New" to the new application route', async () => {
    mockGqlRequest.mockResolvedValue({ applications: [] });
    render(<KanbanBoard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /new application/i })).toHaveAttribute(
        'href',
        '/applications/new',
      );
    });
  });
});
