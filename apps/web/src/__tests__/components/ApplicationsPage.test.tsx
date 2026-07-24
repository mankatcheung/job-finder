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

  describe('bulk actions', () => {
    const apps = [
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
      mockGqlRequest.mockResolvedValue({ applications: apps });
    });

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
      mockGqlRequest.mockResolvedValue({ updateApplication: { id: '1' } });

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
      mockGqlRequest.mockResolvedValue({ updateApplication: { id: '1' } });

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
      mockGqlRequest.mockResolvedValue({ updateApplication: { id: '1' } });

      fireEvent.click(screen.getByRole('button', { name: /^star$/i }));
      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('updateApplication'), {
          id: '1',
          input: { starred: true },
        });
      });

      fireEvent.click(screen.getByRole('button', { name: /unstar/i }));
      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('updateApplication'), {
          id: '1',
          input: { starred: false },
        });
      });
    });

    it('confirms and bulk-deletes selected applications, then clears selection', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      render(<ApplicationsPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(screen.getByLabelText('Select all'));
      mockGqlRequest.mockResolvedValue({ deleteApplication: true });

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

      expect(window.confirm).toHaveBeenCalledWith('Delete 2 selected applications?');
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

    it('does not delete when the confirmation dialog is dismissed', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      render(<ApplicationsPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(screen.getByLabelText('Select Stripe'));
      mockGqlRequest.mockClear();

      fireEvent.click(screen.getByRole('button', { name: /delete/i }));

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
