import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockNavigate, mockGqlRequest } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGqlRequest: vi.fn().mockResolvedValue({ me: { avatarUrl: null } }),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => opts,
  useNavigate: () => mockNavigate,
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => string }) =>
    select({ location: { pathname: '/' } }),
  useChildMatches: () => [{ routeId: '/_authenticated/dashboard' }],
  redirect: vi.fn(),
  Outlet: () => <div data-testid="outlet" />,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({ handler: (fn: () => unknown) => fn }),
}));

vi.mock('@tanstack/react-start/server', () => ({
  getCookie: vi.fn(),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
  hasSessionCookie: vi.fn().mockReturnValue(true),
}));

vi.mock('#/lib/queryClient', () => ({
  queryClient: { clear: vi.fn() },
}));

import { ThemeProvider } from '#/lib/theme';
import { AuthenticatedLayout } from '#/routes/_authenticated/-components/AuthenticatedLayout';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}

describe('AuthenticatedLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation links', () => {
    render(<AuthenticatedLayout />, { wrapper: Wrapper });
    // "Trakwyn" appears in both mobile header and desktop sidebar
    expect(screen.getAllByText('Trakwyn').length).toBeGreaterThanOrEqual(1);
    // "Dashboard" / "Account" appear in sidebar and bottom nav
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1);
    // "Applications" appears in mobile sidebar drawer and desktop sidebar (bottom nav shows "Apps")
    expect(screen.getAllByText('Applications').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the Outlet for page content', () => {
    render(<AuthenticatedLayout />, { wrapper: Wrapper });
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('renders a sign out button', () => {
    render(<AuthenticatedLayout />, { wrapper: Wrapper });
    const signOutBtns = screen.getAllByRole('button', { name: /sign out/i });
    expect(signOutBtns.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('desktop-sidebar-logout')).toBeInTheDocument();
  });

  it('renders logout in the mobile sidebar drawer', () => {
    render(<AuthenticatedLayout />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /open menu/i }));

    expect(screen.getByTestId('mobile-sidebar-logout')).toBeInTheDocument();
  });

  it('calls logout mutation and navigates to /login on sign out', async () => {
    mockGqlRequest.mockResolvedValue({ logout: true });
    render(<AuthenticatedLayout />, { wrapper: Wrapper });

    // Click the first sign-out button (mobile sidebar drawer)
    fireEvent.click(screen.getAllByRole('button', { name: /sign out/i })[0]);

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('logout'));
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
    });
  });

  it('shows the avatar image in the Account nav item when one is set', async () => {
    mockGqlRequest.mockResolvedValue({ me: { avatarUrl: 'https://cdn.example.com/avatar.png' } });
    render(<AuthenticatedLayout />, { wrapper: Wrapper });

    await waitFor(() => {
      const images = screen.getAllByAltText('Your avatar');
      expect(
        images.some((img) => img.getAttribute('src') === 'https://cdn.example.com/avatar.png'),
      ).toBe(true);
    });
  });
});
