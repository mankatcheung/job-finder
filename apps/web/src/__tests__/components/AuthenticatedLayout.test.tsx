import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockNavigate, mockGqlRequest } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGqlRequest: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useNavigate: () => mockNavigate,
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => string }) =>
    select({ location: { pathname: '/' } }),
  redirect: vi.fn(),
  Outlet: () => <div data-testid="outlet" />,
}));

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({ handler: (fn: () => unknown) => fn }),
}));

vi.mock('@tanstack/react-start/server', () => ({
  getCookie: vi.fn(),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

vi.mock('#/lib/queryClient', () => ({
  queryClient: { clear: vi.fn() },
}));

import { ThemeProvider } from '#/lib/theme';
import { AuthenticatedLayout } from '#/routes/_authenticated/route';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('AuthenticatedLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation links', () => {
    render(<AuthenticatedLayout />, { wrapper: Wrapper });
    // "Job Finder" appears in both mobile header and desktop sidebar
    expect(screen.getAllByText('Job Finder').length).toBeGreaterThanOrEqual(1);
    // "Dashboard" / "Account" appear in sidebar and bottom nav
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Account').length).toBeGreaterThanOrEqual(1);
    // "Applications" appears only in the sidebar (bottom nav shows "Apps")
    expect(screen.getByText('Applications')).toBeInTheDocument();
  });

  it('renders the Outlet for page content', () => {
    render(<AuthenticatedLayout />, { wrapper: Wrapper });
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('renders a sign out button', () => {
    render(<AuthenticatedLayout />, { wrapper: Wrapper });
    const signOutBtns = screen.getAllByRole('button', { name: /sign out/i });
    expect(signOutBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('calls logout mutation and navigates to /login on sign out', async () => {
    mockGqlRequest.mockResolvedValue({ logout: true });
    render(<AuthenticatedLayout />, { wrapper: Wrapper });

    // Click the first sign-out button (mobile header icon button)
    fireEvent.click(screen.getAllByRole('button', { name: /sign out/i })[0]);

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('logout'));
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
    });
  });
});
