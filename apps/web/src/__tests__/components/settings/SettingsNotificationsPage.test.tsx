import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: object) => ({ ...opts, useSearch: () => ({}) }),
  useNavigate: () => vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({ handler: (fn: () => unknown) => fn }),
}));

vi.mock('@tanstack/react-start/server', () => ({
  getCookie: vi.fn(),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
  setAccessToken: vi.fn(),
}));

vi.mock('#/lib/queryClient', () => ({
  queryClient: { clear: vi.fn(), resetQueries: vi.fn() },
}));

vi.mock('@vercel/blob/client', () => ({
  put: vi.fn(),
}));

import { ThemeProvider } from '#/lib/theme';
import { SettingsNotificationsPage } from '#/routes/_authenticated/settings/-components/SettingsNotificationsPage';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}

const defaultResponse = {
  me: {
    id: 'user-1',
    email: 'test@example.com',
    name: null,
    timezone: null,
    targetRole: null,
    avatarUrl: null,
  },
  notificationPreferences: { weeklyDigestEnabled: true, followUpRemindersEnabled: true },
};

describe('SettingsNotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGqlRequest.mockResolvedValue(defaultResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('notification preferences', () => {
    it('renders both toggles reflecting current preferences', async () => {
      render(<SettingsNotificationsPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Weekly job search digest')).toBeInTheDocument();
      });
      const weeklyToggle = screen.getByLabelText('Weekly job search digest') as HTMLInputElement;
      const reminderToggle = screen.getByLabelText('Follow-up reminder emails') as HTMLInputElement;
      expect(weeklyToggle.checked).toBe(true);
      expect(reminderToggle.checked).toBe(true);
    });

    it('calls updateNotificationPreferences when the weekly digest toggle is switched off', async () => {
      render(<SettingsNotificationsPage />, { wrapper: Wrapper });
      await waitFor(() => screen.getByLabelText('Weekly job search digest'));

      mockGqlRequest.mockResolvedValueOnce({ updateNotificationPreferences: true });
      fireEvent.click(screen.getByLabelText('Weekly job search digest'));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(
          expect.stringContaining('UpdateNotificationPreferences'),
          { weeklyDigestEnabled: false },
        );
      });
    });

    it('calls updateNotificationPreferences when the reminders toggle is switched off', async () => {
      render(<SettingsNotificationsPage />, { wrapper: Wrapper });
      await waitFor(() => screen.getByLabelText('Follow-up reminder emails'));

      mockGqlRequest.mockResolvedValueOnce({ updateNotificationPreferences: true });
      fireEvent.click(screen.getByLabelText('Follow-up reminder emails'));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(
          expect.stringContaining('UpdateNotificationPreferences'),
          { followUpRemindersEnabled: false },
        );
      });
    });
  });
});
