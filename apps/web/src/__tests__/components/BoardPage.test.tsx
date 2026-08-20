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
  boardPosition: 0,
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
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });
    for (const status of [
      'Draft',
      'Applied',
      'Interviewing',
      'Offered',
      'Accepted',
      'Rejected',
      'Withdrawn',
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

  it('refetches applications when the board is remounted', async () => {
    mockGqlRequest.mockResolvedValue({ applications: [app()] });
    const client = makeClient();
    const view = render(
      <QueryClientProvider client={client}>
        <KanbanBoard />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument());
    view.unmount();

    render(
      <QueryClientProvider client={client}>
        <KanbanBoard />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mockGqlRequest).toHaveBeenCalledTimes(2));
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

  it('renders cards within a column in boardPosition order', async () => {
    mockGqlRequest.mockResolvedValue({
      applications: [
        app({ id: '1', company: 'Acme', status: 'applied', boardPosition: 1 }),
        app({ id: '2', company: 'Globex', status: 'applied', boardPosition: 2 }),
        app({ id: '3', company: 'Initech', status: 'applied', boardPosition: 0 }),
      ],
    });
    render(<KanbanBoard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Initech')).toBeInTheDocument();
    });

    const order = screen
      .getAllByText(/^(Acme|Globex|Initech)$/)
      .map((element) => element.textContent);
    expect(order).toEqual(['Initech', 'Acme', 'Globex']);
  });

  it('falls back to newest-first when positions tie', async () => {
    // Nothing has been dragged yet, so every card still sits at 0 — the board
    // has to look exactly as it did before ranks existed.
    mockGqlRequest.mockResolvedValue({
      applications: [
        app({
          id: '1',
          company: 'Acme',
          status: 'applied',
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
        app({
          id: '2',
          company: 'Globex',
          status: 'applied',
          createdAt: '2024-06-01T00:00:00.000Z',
        }),
      ],
    });
    render(<KanbanBoard />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Acme')).toBeInTheDocument();
    });

    const order = screen.getAllByText(/^(Acme|Globex)$/).map((element) => element.textContent);
    expect(order).toEqual(['Globex', 'Acme']);
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
