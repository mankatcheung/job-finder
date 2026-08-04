import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

vi.mock('#/lib/undoToast', () => ({
  showUndoToast: vi.fn(({ onExecute }) => {
    onExecute();
  }),
}));

vi.mock('#/graphql/generated/graphql', () => ({}));

import { ApplicationsPage } from '#/routes/_authenticated/applications/index';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

type ApplicationFixture = {
  id: string;
  company: string;
  role: string;
  status: string;
  location: string | null;
  starred?: boolean;
  appliedAt: string | null;
  tags: string[];
  createdAt: string;
};

function page(items: ApplicationFixture[], hasNextPage = false, nextCursor: string | null = null) {
  return { applicationsPage: { items, hasNextPage, nextCursor } };
}

describe('ApplicationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearch.mockReturnValue({});
  });

  it('shows empty state when no applications', async () => {
    mockGqlRequest.mockResolvedValue(page([]));
    render(<ApplicationsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/No applications/)).toBeInTheDocument();
    });
  });

  it('renders application rows', async () => {
    mockGqlRequest.mockResolvedValue(
      page([
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
      ]),
    );
    render(<ApplicationsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.getByText('Vercel')).toBeInTheDocument();
    });
    expect(screen.getByText('Engineer · Remote')).toBeInTheDocument();
  });

  it('shows status filter dropdown', async () => {
    mockGqlRequest.mockResolvedValue(page([]));
    render(<ApplicationsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('All statuses')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('All statuses')).toBeInTheDocument();
  });

  it('shows filtered empty state when status filter active', async () => {
    mockUseSearch.mockReturnValue({ status: 'applied' });
    mockGqlRequest.mockResolvedValue(page([]));
    render(<ApplicationsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/No applications with status "applied"/)).toBeInTheDocument();
    });
  });

  it('shows the page heading', async () => {
    mockGqlRequest.mockResolvedValue(page([]));
    render(<ApplicationsPage />, { wrapper: Wrapper });

    expect(screen.getByText('Applications')).toBeInTheDocument();
  });

  describe('server-side query variables', () => {
    it('requests the first page with default status/starred/search and the page-size limit', async () => {
      mockGqlRequest.mockResolvedValue(page([]));
      render(<ApplicationsPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('applicationsPage'), {
          status: null,
          starred: null,
          search: null,
          cursor: undefined,
          limit: 20,
        });
      });
    });

    it('passes the status and starred filters from the route search params', async () => {
      mockUseSearch.mockReturnValue({ status: 'applied', starred: true });
      mockGqlRequest.mockResolvedValue(page([]));
      render(<ApplicationsPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(
          expect.stringContaining('applicationsPage'),
          expect.objectContaining({ status: 'applied', starred: true }),
        );
      });
    });

    it('debounces the search input and sends it as the search variable', async () => {
      vi.useFakeTimers();
      mockGqlRequest.mockResolvedValue(page([]));
      render(<ApplicationsPage />, { wrapper: Wrapper });

      fireEvent.change(screen.getByPlaceholderText('Search company, role, location…'), {
        target: { value: 'Stripe' },
      });

      vi.advanceTimersByTime(250);
      vi.useRealTimers();

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(
          expect.stringContaining('applicationsPage'),
          expect.objectContaining({ search: 'stripe' }),
        );
      });
    });
  });

  describe('infinite scroll', () => {
    class FakeIntersectionObserver implements IntersectionObserver {
      static instances: FakeIntersectionObserver[] = [];
      readonly root = null;
      readonly rootMargin = '';
      readonly scrollMargin = '';
      readonly thresholds: ReadonlyArray<number> = [];
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
      private readonly callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        FakeIntersectionObserver.instances.push(this);
      }
      trigger(isIntersecting: boolean) {
        this.callback([{ isIntersecting } as IntersectionObserverEntry], this);
      }
    }

    let originalIntersectionObserver: typeof IntersectionObserver;

    beforeEach(() => {
      FakeIntersectionObserver.instances = [];
      originalIntersectionObserver = window.IntersectionObserver;
      window.IntersectionObserver =
        FakeIntersectionObserver as unknown as typeof IntersectionObserver;
    });

    afterEach(() => {
      window.IntersectionObserver = originalIntersectionObserver;
    });

    it('fetches the next page with the returned cursor when the sentinel intersects', async () => {
      mockGqlRequest.mockResolvedValueOnce(
        page(
          [
            {
              id: '1',
              company: 'Stripe',
              role: 'Engineer',
              status: 'applied',
              location: null,
              appliedAt: null,
              tags: [],
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          ],
          true,
          '1',
        ),
      );
      render(<ApplicationsPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      mockGqlRequest.mockResolvedValueOnce(
        page(
          [
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
          false,
          null,
        ),
      );

      expect(FakeIntersectionObserver.instances).toHaveLength(1);
      FakeIntersectionObserver.instances[0].trigger(true);

      await waitFor(() => expect(screen.getByText('Vercel')).toBeInTheDocument());
      expect(mockGqlRequest).toHaveBeenLastCalledWith(
        expect.stringContaining('applicationsPage'),
        expect.objectContaining({ cursor: '1' }),
      );
    });

    it('does not observe the sentinel when there is no next page', async () => {
      mockGqlRequest.mockResolvedValue(
        page(
          [
            {
              id: '1',
              company: 'Stripe',
              role: 'Engineer',
              status: 'applied',
              location: null,
              appliedAt: null,
              tags: [],
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          ],
          false,
          null,
        ),
      );
      render(<ApplicationsPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      expect(FakeIntersectionObserver.instances).toHaveLength(0);
    });
  });

  describe('bulk actions', () => {
    const apps: ApplicationFixture[] = [
      {
        id: '1',
        company: 'Stripe',
        role: 'Engineer',
        status: 'applied',
        location: 'Remote',
        starred: false,
        appliedAt: null,
        tags: ['backend'],
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        company: 'Vercel',
        role: 'Frontend',
        status: 'draft',
        location: null,
        starred: false,
        appliedAt: null,
        tags: [],
        createdAt: '2024-01-02T00:00:00.000Z',
      },
    ];

    beforeEach(() => {
      mockGqlRequest.mockResolvedValue(page(apps));
    });

    // The bulk-action hook invalidates the applicationsPage query after each
    // mutation, which triggers a refetch through this same mock — so the
    // mock must keep answering that refetch correctly rather than being
    // blanket-overridden to only the mutation's response.
    function mockMutationResult(result: unknown) {
      mockGqlRequest.mockImplementation((query: unknown) =>
        typeof query === 'string' && query.includes('applicationsPage')
          ? Promise.resolve(page(apps))
          : Promise.resolve(result),
      );
    }

    it('shows a select-all checkbox with no selection message initially', async () => {
      render(<ApplicationsPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());
      expect(screen.getByText('Select all')).toBeInTheDocument();
    });

    it('shows the floating action bar with a count when a row is selected', async () => {
      render(<ApplicationsPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(screen.getByLabelText('Select Stripe'));

      expect(screen.getByText('1 selected')).toBeInTheDocument();
      expect(screen.getByText('1 of 2 selected')).toBeInTheDocument();
    });

    it('selects and deselects all rows via the header checkbox', async () => {
      render(<ApplicationsPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(screen.getByLabelText('Select all'));
      expect(screen.getByText('2 selected')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Deselect all'));
      expect(screen.queryByText('2 selected')).not.toBeInTheDocument();
    });

    it('applies a bulk status change to all selected applications', async () => {
      render(<ApplicationsPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(screen.getByLabelText('Select all'));
      mockMutationResult({ updateApplication: { id: '1' } });

      fireEvent.change(screen.getByDisplayValue('Change status…'), {
        target: { value: 'interviewing' },
      });

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('updateApplication'), {
          id: '1',
          input: { status: 'interviewing' },
        });
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('updateApplication'), {
          id: '2',
          input: { status: 'interviewing' },
        });
      });
    });

    it('merges the new tag with each application’s existing tags', async () => {
      render(<ApplicationsPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(screen.getByLabelText('Select all'));
      mockMutationResult({ updateApplication: { id: '1' } });

      fireEvent.change(screen.getByPlaceholderText('Add tag…'), { target: { value: 'urgent' } });
      fireEvent.click(screen.getByLabelText('Add tag to selected'));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('updateApplication'), {
          id: '1',
          input: { tags: ['backend', 'urgent'] },
        });
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('updateApplication'), {
          id: '2',
          input: { tags: ['urgent'] },
        });
      });
    });

    it('bulk stars and unstars selected applications', async () => {
      render(<ApplicationsPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(screen.getByLabelText('Select Stripe'));
      mockMutationResult({ updateApplication: { id: '1' } });

      fireEvent.click(screen.getByRole('button', { name: 'Star selected' }));
      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('updateApplication'), {
          id: '1',
          input: { starred: true },
        });
      });

      fireEvent.click(screen.getByRole('button', { name: 'Unstar selected' }));
      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('updateApplication'), {
          id: '1',
          input: { starred: false },
        });
      });
    });

    it('bulk-deletes selected applications', async () => {
      render(<ApplicationsPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(screen.getByLabelText('Select all'));
      mockMutationResult({ deleteApplication: true });

      fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('deleteApplication'), {
          id: '1',
        });
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('deleteApplication'), {
          id: '2',
        });
      });
      expect(screen.queryByText('2 selected')).not.toBeInTheDocument();
    });
    it('does not delete when undo is clicked', async () => {
      // Override mock to NOT execute immediately
      const { showUndoToast } = await import('#/lib/undoToast');
      vi.mocked(showUndoToast).mockImplementation(() => {});

      render(<ApplicationsPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(screen.getByLabelText('Select Stripe'));
      mockGqlRequest.mockClear();

      fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }));

      // Without the mock calling onExecute, no delete mutation should fire
      await new Promise((r) => setTimeout(r, 100));
      expect(mockGqlRequest).not.toHaveBeenCalledWith(
        expect.stringContaining('deleteApplication'),
        expect.anything(),
      );
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('clears the selection via the clear button', async () => {
      render(<ApplicationsPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(screen.getByLabelText('Select Stripe'));
      expect(screen.getByText('1 selected')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Clear selection'));
      expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });
  });
});
