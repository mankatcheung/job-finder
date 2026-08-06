import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'jest-axe';

/* ------------------------------------------------------------------ */
/*  Shared mocks — reused across every component under test            */
/* ------------------------------------------------------------------ */

const { mockNavigate, mockGqlRequest, mockSetAccessToken, mockUseSearch } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGqlRequest: vi.fn(),
  mockSetAccessToken: vi.fn(),
  mockUseSearch: vi.fn().mockReturnValue({}),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => ({ ...(opts as object), useSearch: mockUseSearch }),
  useNavigate: () => mockNavigate,
  useRouterState: ({ select }: { select: (s: { location: { pathname: string } }) => string }) =>
    select({ location: { pathname: '/dashboard' } }),
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
  setAccessToken: mockSetAccessToken,
  hydrateSession: vi.fn().mockResolvedValue(false),
}));

vi.mock('#/lib/queryClient', () => ({
  queryClient: { clear: vi.fn(), resetQueries: vi.fn() },
}));

vi.mock('@vercel/blob/client', () => ({
  put: vi.fn(),
}));

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

async function checkA11y(
  ui: React.ReactElement,
  wrapper?: React.ComponentType<{ children: React.ReactNode }>,
) {
  const { container } = render(ui, {
    wrapper: (wrapper ?? Wrapper) as React.ComponentType<{ children: React.ReactNode }>,
  });
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe('Accessibility audits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearch.mockReturnValue({});
  });

  /* ---- public pages ------------------------------------------------ */

  describe('LoginPage', () => {
    it('has no detectable a11y violations', async () => {
      const { LoginPage } = await import('#/routes/login');
      await checkA11y(<LoginPage />);
    });
  });

  describe('RegisterPage', () => {
    it('has no detectable a11y violations', async () => {
      const { RegisterPage } = await import('#/routes/register');
      await checkA11y(<RegisterPage />);
    });
  });

  describe('ForgotPasswordPage', () => {
    it('has no detectable a11y violations', async () => {
      const { ForgotPasswordPage } = await import('#/routes/forgot-password');
      await checkA11y(<ForgotPasswordPage />);
    });
  });

  describe('ResetPasswordPage', () => {
    it('has no detectable a11y violations', async () => {
      mockUseSearch.mockReturnValue({ token: 'valid-token' });
      const { ResetPasswordPage } = await import('#/routes/reset-password');
      await checkA11y(<ResetPasswordPage />);
    });
  });

  /* ---- authenticated pages ----------------------------------------- */

  describe('AuthenticatedLayout', () => {
    it('has no detectable a11y violations', async () => {
      mockGqlRequest.mockResolvedValue({ me: { avatarUrl: null } });
      const { ThemeProvider } = await import('#/lib/theme');
      const { AuthenticatedLayout } =
        await import('#/routes/_authenticated/-components/AuthenticatedLayout');

      function AuthWrapper({ children }: { children: React.ReactNode }) {
        return (
          <ThemeProvider>
            <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>
          </ThemeProvider>
        );
      }

      await checkA11y(<AuthenticatedLayout />, AuthWrapper);
    });
  });

  describe('DashboardPage', () => {
    it('has no detectable a11y violations', async () => {
      mockGqlRequest.mockResolvedValue({ applications: [] });
      const { DashboardPage } = await import('#/routes/_authenticated/dashboard');
      await checkA11y(<DashboardPage />);
    });
  });

  describe('SettingsNotificationsPage', () => {
    it('has no detectable a11y violations', async () => {
      mockGqlRequest.mockResolvedValue({
        me: {
          id: 'user-1',
          email: 'test@example.com',
          name: null,
          timezone: null,
          targetRole: null,
          avatarUrl: null,
        },
        notificationPreferences: {
          weeklyDigestEnabled: true,
          followUpRemindersEnabled: true,
          pushNotificationsEnabled: false,
        },
      });
      const { ThemeProvider } = await import('#/lib/theme');
      const { SettingsNotificationsPage } =
        await import('#/routes/_authenticated/settings/notifications');

      function SettingsWrapper({ children }: { children: React.ReactNode }) {
        return (
          <ThemeProvider>
            <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>
          </ThemeProvider>
        );
      }

      await checkA11y(<SettingsNotificationsPage />, SettingsWrapper);
    });
  });
});
