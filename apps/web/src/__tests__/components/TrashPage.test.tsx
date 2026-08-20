import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => <a href={`${to}${params ? '/' + Object.values(params).join('/') : ''}`}>{children}</a>,
  useNavigate: () => vi.fn(),
}));

vi.mock('#/graphql/client', () => ({ gqlClient: { request: mockGqlRequest } }));

vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import { TrashPage } from '#/routes/_authenticated/applications/-components/TrashPage';
import { daysUntilPurge } from '#/routes/_authenticated/applications/-trash-queries';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

const NOW = new Date('2026-08-20T12:00:00.000Z');

const trashed = {
  id: 'app-1',
  company: 'Stripe',
  role: 'Software Engineer',
  status: 'applied',
  location: 'Remote',
  appliedAt: '2026-07-01T00:00:00.000Z',
  deletedAt: '2026-08-15T12:00:00.000Z',
  // 30-day retention from deletedAt → 25 days left at NOW.
  purgeAt: '2026-09-14T12:00:00.000Z',
};

describe('daysUntilPurge', () => {
  it('rounds a partial day up so the final hours still read as a whole day', () => {
    expect(daysUntilPurge('2026-08-21T06:00:00.000Z', NOW)).toBe(1);
  });

  it('clamps to 0 once the purge instant has passed', () => {
    expect(daysUntilPurge('2026-08-19T12:00:00.000Z', NOW)).toBe(0);
  });

  it('returns null when there is no purge date', () => {
    expect(daysUntilPurge(null, NOW)).toBeNull();
  });
});

describe('TrashPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lists trashed applications with a countdown to permanent deletion', async () => {
    mockGqlRequest.mockResolvedValue({ trashedApplications: [trashed] });
    render(<TrashPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Deletes in 25 days')).toBeInTheDocument();
  });

  it('shows an empty state when nothing is in Trash', async () => {
    mockGqlRequest.mockResolvedValue({ trashedApplications: [] });
    render(<TrashPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Trash is empty')).toBeInTheDocument());
  });

  it('restores an application', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('RestoreApplication'))
        return Promise.resolve({ restoreApplication: true });
      return Promise.resolve({ trashedApplications: [trashed] });
    });
    render(<TrashPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Restore Stripe'));

    await waitFor(() =>
      expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('RestoreApplication'), {
        id: 'app-1',
      }),
    );
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('does not permanently delete when the confirmation is declined', async () => {
    mockGqlRequest.mockResolvedValue({ trashedApplications: [trashed] });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<TrashPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Permanently delete Stripe'));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockGqlRequest).not.toHaveBeenCalledWith(
      expect.stringContaining('PermanentlyDeleteApplication'),
      expect.anything(),
    );
  });

  it('permanently deletes once confirmed', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('PermanentlyDeleteApplication'))
        return Promise.resolve({ permanentlyDeleteApplication: true });
      return Promise.resolve({ trashedApplications: [trashed] });
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<TrashPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Permanently delete Stripe'));

    await waitFor(() =>
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('PermanentlyDeleteApplication'),
        { id: 'app-1' },
      ),
    );
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('surfaces a load failure with a retry instead of an empty Trash', async () => {
    mockGqlRequest.mockRejectedValue(new Error('network down'));
    render(<TrashPage />, { wrapper: Wrapper });

    // getErrorMessage maps an unrecognized failure to a friendly string, so the
    // retry affordance is what distinguishes "failed" from "nothing in Trash".
    await waitFor(() => expect(screen.getByText('Try again')).toBeInTheDocument());
    expect(screen.queryByText('Trash is empty')).not.toBeInTheDocument();
  });
});
