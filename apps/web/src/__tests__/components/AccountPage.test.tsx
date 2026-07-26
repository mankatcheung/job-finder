import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockNavigate, mockGqlRequest, mockClearAuthIndicator, mockPutBlob } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGqlRequest: vi.fn(),
  mockClearAuthIndicator: vi.fn(),
  mockPutBlob: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: object) => ({ ...opts, useSearch: () => ({}) }),
  useNavigate: () => mockNavigate,
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
}));

vi.mock('#/lib/auth', () => ({
  isAuthenticated: vi.fn().mockReturnValue(true),
  getIsAuthenticated: vi.fn().mockResolvedValue(true),
  clearAuthIndicator: mockClearAuthIndicator,
}));

vi.mock('#/lib/queryClient', () => ({
  queryClient: { clear: vi.fn(), resetQueries: vi.fn() },
}));

vi.mock('@vercel/blob/client', () => ({
  put: mockPutBlob,
}));

import { ThemeProvider } from '#/lib/theme';
import { AccountPage } from '#/routes/_authenticated/account';

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
  sessions: [
    {
      id: 'session-1',
      userAgent: 'Mozilla/5.0 (Macintosh)',
      ipAddress: '10.0.0.1',
      lastUsedAt: '2024-01-01T00:00:00.000Z',
      current: true,
    },
  ],
  notificationPreferences: { weeklyDigestEnabled: true, followUpRemindersEnabled: true },
  loginHistory: [],
  totpEnabled: false,
  linkedOAuthAccounts: [],
};

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGqlRequest.mockResolvedValue(defaultResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all sections', async () => {
    render(<AccountPage />, { wrapper: Wrapper });
    expect(screen.getByText('Account settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Email address')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Two-factor authentication')).toBeInTheDocument();
    expect(screen.getByText('Active sessions')).toBeInTheDocument();
    expect(screen.getByText('Recent login activity')).toBeInTheDocument();
    expect(screen.getByText('Notification preferences')).toBeInTheDocument();
    expect(screen.getByText('Export your data')).toBeInTheDocument();
    expect(screen.getByText('Import your data')).toBeInTheDocument();
    expect(screen.getByText('Danger zone')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('Me'));
    });
    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('Sessions'));
    });
    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('NotificationPreferences'),
      );
    });
    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('LoginHistory'));
    });
    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('TotpEnabled'));
    });
  });

  describe('profile form', () => {
    it('pre-fills fields from the me query', async () => {
      mockGqlRequest.mockResolvedValue({
        ...defaultResponse,
        me: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Jeff Man',
          timezone: 'America/Los_Angeles',
          targetRole: 'Staff Engineer',
        },
      });
      render(<AccountPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jeff Man')).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('America/Los_Angeles')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Staff Engineer')).toBeInTheDocument();
    });

    it('calls updateProfile mutation with trimmed values', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() =>
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('Me')),
      );
      mockGqlRequest.mockResolvedValue({ updateProfile: true });

      const saveBtn = screen.getByRole('button', { name: /save profile/i });
      const form = saveBtn.closest('form')!;
      const nameInput = form.querySelector('input[placeholder="Jane Doe"]')!;
      const timezoneInput = form.querySelector('input[placeholder="America/Los_Angeles"]')!;
      const targetRoleInput = form.querySelector('input[placeholder="Senior Product Designer"]')!;

      fireEvent.change(nameInput, { target: { value: '  Jeff Man  ' } });
      fireEvent.change(timezoneInput, { target: { value: 'UTC' } });
      fireEvent.change(targetRoleInput, { target: { value: 'Staff Engineer' } });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('UpdateProfile'), {
          name: 'Jeff Man',
          timezone: 'UTC',
          targetRole: 'Staff Engineer',
        });
      });
    });

    it('sends null for cleared fields', async () => {
      mockGqlRequest.mockResolvedValue({
        ...defaultResponse,
        me: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Old Name',
          timezone: null,
          targetRole: null,
        },
      });
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByDisplayValue('Old Name')).toBeInTheDocument());
      mockGqlRequest.mockResolvedValue({ updateProfile: true });

      const saveBtn = screen.getByRole('button', { name: /save profile/i });
      const form = saveBtn.closest('form')!;
      const nameInput = form.querySelector('input[placeholder="Jane Doe"]')!;

      fireEvent.change(nameInput, { target: { value: '   ' } });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(
          expect.stringContaining('UpdateProfile'),
          expect.objectContaining({ name: null }),
        );
      });
    });

    it('shows error message on profile update failure', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() =>
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('Me')),
      );
      mockGqlRequest.mockRejectedValue({
        response: { errors: [{ message: 'Invalid timezone' }] },
      });

      const saveBtn = screen.getByRole('button', { name: /save profile/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText('Invalid timezone')).toBeInTheDocument();
      });
    });
  });

  describe('email update form', () => {
    it('calls requestEmailChange mutation with current password and new email', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());
      mockGqlRequest.mockResolvedValue({ requestEmailChange: true });

      const updateEmailBtn = screen.getByRole('button', { name: /update email/i });
      const form = updateEmailBtn.closest('form')!;
      const pwInput = form.querySelector('input[type="password"]')!;
      const emailInput = form.querySelector('input[type="email"]')!;

      fireEvent.change(pwInput, { target: { value: 'mypassword' } });
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      fireEvent.click(updateEmailBtn);

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('RequestEmailChange'), {
          currentPassword: 'mypassword',
          newEmail: 'new@example.com',
        });
      });
    });

    it('shows error message on email update failure', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());
      mockGqlRequest.mockRejectedValue({
        response: { errors: [{ message: 'Email already in use' }] },
      });

      const updateEmailBtn = screen.getByRole('button', { name: /update email/i });
      const form = updateEmailBtn.closest('form')!;
      const pwInput = form.querySelector('input[type="password"]')!;
      const emailInput = form.querySelector('input[type="email"]')!;

      fireEvent.change(pwInput, { target: { value: 'mypassword' } });
      fireEvent.change(emailInput, { target: { value: 'taken@example.com' } });
      fireEvent.click(updateEmailBtn);

      await waitFor(() => {
        expect(screen.getByText('Email already in use')).toBeInTheDocument();
      });
    });
  });

  describe('avatar', () => {
    const selectAvatarFile = (name = 'me.png', type = 'image/png') => {
      const file = new File(['fake-image-bytes'], name, { type });
      const section = screen.getByText('Profile').closest('section')!;
      const input = section.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });
    };

    it('uploads a photo via requestAvatarUploadUrl then confirmAvatar', async () => {
      mockPutBlob.mockResolvedValue({ url: 'https://blob.example.com/avatar.png' });

      mockGqlRequest.mockImplementation((query: unknown) => {
        if (typeof query === 'string' && query.includes('RequestAvatarUploadUrl')) {
          return Promise.resolve({
            requestAvatarUploadUrl: {
              uploadUrl: 'https://storage.example.com/upload',
              storageKey: 'users/user-1/avatar/key.png',
            },
          });
        }
        if (typeof query === 'string' && query.includes('ConfirmAvatar')) {
          return Promise.resolve({ confirmAvatar: 'https://cdn.example.com/avatar.png' });
        }
        return Promise.resolve(defaultResponse);
      });

      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() =>
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('Me')),
      );

      selectAvatarFile();

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(
          expect.stringContaining('RequestAvatarUploadUrl'),
          { filename: 'me.png', mimeType: 'image/png' },
        );
      });
      expect(mockPutBlob).toHaveBeenCalledWith('users/user-1/avatar/key.png', expect.any(File), {
        access: 'public',
        token: 'https://storage.example.com/upload',
        contentType: 'image/png',
      });
      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('ConfirmAvatar'), {
          storageKey: 'users/user-1/avatar/key.png',
          mimeType: 'image/png',
          sizeBytes: expect.any(Number) as number,
        });
      });
    });

    it('shows an error message when the upload fails', async () => {
      mockPutBlob.mockResolvedValue({ url: 'https://blob.example.com/avatar.png' });
      mockGqlRequest.mockImplementation((query: unknown) => {
        if (typeof query === 'string' && query.includes('RequestAvatarUploadUrl')) {
          return Promise.reject({ response: { errors: [{ message: 'Unsupported file type' }] } });
        }
        return Promise.resolve(defaultResponse);
      });

      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() =>
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('Me')),
      );

      selectAvatarFile();

      await waitFor(() => {
        expect(screen.getByText('Unsupported file type')).toBeInTheDocument();
      });

      vi.unstubAllGlobals();
    });

    it('calls removeAvatar when Remove is clicked', async () => {
      mockGqlRequest.mockResolvedValue({
        ...defaultResponse,
        me: { ...defaultResponse.me, avatarUrl: 'https://cdn.example.com/avatar.png' },
      });

      render(<AccountPage />, { wrapper: Wrapper });
      const removeBtn = await screen.findByRole('button', { name: /remove/i });
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('RemoveAvatar'));
      });
    });

    it('does not show a Remove button when there is no avatar', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() =>
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('Me')),
      );

      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    });
  });

  describe('password update form', () => {
    it('shows validation error when new passwords do not match', async () => {
      render(<AccountPage />, { wrapper: Wrapper });

      const updatePasswordBtn = screen.getByRole('button', { name: /update password/i });
      const form = updatePasswordBtn.closest('form')!;
      const inputs = form.querySelectorAll('input[type="password"]');

      fireEvent.change(inputs[0], { target: { value: 'currentPass1' } });
      fireEvent.change(inputs[1], { target: { value: 'newPass1234' } });
      fireEvent.change(inputs[2], { target: { value: 'differentPass' } });
      fireEvent.click(updatePasswordBtn);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
      expect(mockGqlRequest).not.toHaveBeenCalledWith(
        expect.stringContaining('UpdatePassword'),
        expect.anything(),
      );
    });

    it('calls updatePassword mutation with matching passwords', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());
      mockGqlRequest.mockResolvedValue({ updatePassword: true });

      const updatePasswordBtn = screen.getByRole('button', { name: /update password/i });
      const form = updatePasswordBtn.closest('form')!;
      const inputs = form.querySelectorAll('input[type="password"]');

      fireEvent.change(inputs[0], { target: { value: 'currentPass1' } });
      fireEvent.change(inputs[1], { target: { value: 'newPass1234' } });
      fireEvent.change(inputs[2], { target: { value: 'newPass1234' } });
      fireEvent.click(updatePasswordBtn);

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('UpdatePassword'), {
          currentPassword: 'currentPass1',
          newPassword: 'newPass1234',
        });
      });
    });

    it('shows generic error message when password update fails', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());
      mockGqlRequest.mockRejectedValue(new Error('network error'));

      const updatePasswordBtn = screen.getByRole('button', { name: /update password/i });
      const form = updatePasswordBtn.closest('form')!;
      const inputs = form.querySelectorAll('input[type="password"]');

      fireEvent.change(inputs[0], { target: { value: 'currentPass1' } });
      fireEvent.change(inputs[1], { target: { value: 'newPass1234' } });
      fireEvent.change(inputs[2], { target: { value: 'newPass1234' } });
      fireEvent.click(updatePasswordBtn);

      await waitFor(() => {
        expect(screen.getByText('Failed to update password.')).toBeInTheDocument();
      });
    });
  });

  describe('two-factor authentication', () => {
    it('shows an "Enable 2FA" button when disabled', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enable 2fa/i })).toBeInTheDocument();
      });
    });

    it('starts setup, shows the QR code and secret, and confirms with a code', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());

      const setupData = {
        beginTotpSetup: {
          secret: 'ABCD1234',
          otpauthUrl: 'otpauth://totp/Job%20Finder:test@example.com?secret=ABCD1234',
          qrCodeDataUrl: 'data:image/png;base64,abc123',
        },
      };
      mockGqlRequest.mockResolvedValueOnce(setupData);
      const enableBtn = screen.getByRole('button', { name: /enable 2fa/i });
      const beginForm = enableBtn.closest('form')!;
      const beginPasswordInput = beginForm.querySelector('input[type="password"]')!;
      fireEvent.change(beginPasswordInput, { target: { value: 'mypassword' } });
      fireEvent.click(enableBtn);

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('BeginTotpSetup'), {
          password: 'mypassword',
        });
      });
      await waitFor(() => {
        expect(screen.getByAltText('Two-factor authentication QR code')).toHaveAttribute(
          'src',
          setupData.beginTotpSetup.qrCodeDataUrl,
        );
      });
      expect(screen.getByText('ABCD1234')).toBeInTheDocument();

      const backupCodes = ['aaaa1111bbbb2222', 'cccc3333dddd4444'];
      mockGqlRequest.mockResolvedValueOnce({ confirmTotpSetup: { backupCodes } });
      fireEvent.change(screen.getByPlaceholderText('123456'), { target: { value: '654321' } });
      fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('ConfirmTotpSetup'), {
          code: '654321',
        });
      });
      await waitFor(() => {
        backupCodes.forEach((code) => expect(screen.getByText(code)).toBeInTheDocument());
      });
    });

    it('shows a disable form when 2FA is already enabled', async () => {
      mockGqlRequest.mockResolvedValue({ ...defaultResponse, totpEnabled: true });
      render(<AccountPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Two-factor authentication is enabled.')).toBeInTheDocument();
      });

      mockGqlRequest.mockResolvedValueOnce({ disableTotp: true });
      const disableBtn = screen.getByRole('button', { name: /disable 2fa/i });
      const form = disableBtn.closest('form')!;
      const passwordInput = form.querySelector('input[type="password"]')!;
      fireEvent.change(passwordInput, { target: { value: 'mypassword' } });
      fireEvent.click(disableBtn);

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('DisableTotp'), {
          password: 'mypassword',
        });
      });
    });
  });

  describe('active sessions', () => {
    it('shows the current session without a revoke button', async () => {
      render(<AccountPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Mozilla/5.0 (Macintosh)')).toBeInTheDocument();
      });
      expect(screen.getByText('This device')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^revoke$/i })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /sign out other sessions/i }),
      ).not.toBeInTheDocument();
    });

    it('shows a revoke button for non-current sessions and calls revokeSession', async () => {
      mockGqlRequest.mockResolvedValue({
        ...defaultResponse,
        sessions: [
          {
            id: 'session-1',
            userAgent: 'Chrome',
            ipAddress: '1.1.1.1',
            lastUsedAt: '2024-01-01T00:00:00.000Z',
            current: true,
          },
          {
            id: 'session-2',
            userAgent: 'Safari',
            ipAddress: '2.2.2.2',
            lastUsedAt: '2024-01-02T00:00:00.000Z',
            current: false,
          },
        ],
      });
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Safari')).toBeInTheDocument());

      mockGqlRequest.mockResolvedValueOnce({ revokeSession: true });
      fireEvent.click(screen.getByRole('button', { name: /^revoke$/i }));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('RevokeSession'), {
          id: 'session-2',
        });
      });
    });

    it('shows "Sign out other sessions" when there is more than one session', async () => {
      mockGqlRequest.mockResolvedValue({
        ...defaultResponse,
        sessions: [
          {
            id: 'session-1',
            userAgent: 'Chrome',
            ipAddress: '1.1.1.1',
            lastUsedAt: '2024-01-01T00:00:00.000Z',
            current: true,
          },
          {
            id: 'session-2',
            userAgent: 'Safari',
            ipAddress: '2.2.2.2',
            lastUsedAt: '2024-01-02T00:00:00.000Z',
            current: false,
          },
        ],
      });
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /sign out other sessions/i }),
        ).toBeInTheDocument(),
      );

      mockGqlRequest.mockResolvedValueOnce({ revokeOtherSessions: true });
      fireEvent.click(screen.getByRole('button', { name: /sign out other sessions/i }));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('RevokeOtherSessions'));
      });
    });
  });

  describe('login history', () => {
    it('renders recent login events with device and IP', async () => {
      mockGqlRequest.mockImplementation((query: unknown) => {
        if (typeof query === 'string' && query.includes('LoginHistory')) {
          return Promise.resolve({
            loginHistory: [
              {
                id: 'event-1',
                ipAddress: '203.0.113.5',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                createdAt: '2024-01-01T00:00:00.000Z',
              },
            ],
          });
        }
        return Promise.resolve(defaultResponse);
      });

      render(<AccountPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText(/Mac · 203.0.113.5/)).toBeInTheDocument();
      });
    });

    it('shows a message when there is no login history', async () => {
      render(<AccountPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('No login activity yet.')).toBeInTheDocument();
      });
    });

    it('shows an error message when login history fails to load', async () => {
      mockGqlRequest.mockImplementation((query: unknown) => {
        if (typeof query === 'string' && query.includes('LoginHistory')) {
          return Promise.reject(new Error('network error'));
        }
        return Promise.resolve(defaultResponse);
      });

      render(<AccountPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Failed to load login history.')).toBeInTheDocument();
      });
    });
  });

  describe('notification preferences', () => {
    it('renders both toggles reflecting current preferences', async () => {
      render(<AccountPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('Weekly job search digest')).toBeInTheDocument();
      });
      const weeklyToggle = screen.getByLabelText('Weekly job search digest') as HTMLInputElement;
      const reminderToggle = screen.getByLabelText('Follow-up reminder emails') as HTMLInputElement;
      expect(weeklyToggle.checked).toBe(true);
      expect(reminderToggle.checked).toBe(true);
    });

    it('calls updateNotificationPreferences when the weekly digest toggle is switched off', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
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
      render(<AccountPage />, { wrapper: Wrapper });
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

  describe('data export', () => {
    it('calls exportUserData and triggers download on success', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());
      mockGqlRequest.mockResolvedValue({ exportUserData: '{"applications":[]}' });
      const mockRevokeObjectURL = vi.fn();
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(mockRevokeObjectURL);

      fireEvent.click(screen.getByRole('button', { name: /download export/i }));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('exportUserData'));
      });
      await waitFor(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      });
    });
  });

  describe('data import', () => {
    const selectFile = (content: string, name = 'export.json') => {
      const file = new File([content], name, { type: 'application/json' });
      const section = screen.getByText('Import your data').closest('section')!;
      const input = section.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });
    };

    it('calls importUserData with the file contents and shows the summary', async () => {
      mockGqlRequest.mockResolvedValue({
        importUserData: {
          applicationsImported: 2,
          applicationsSkipped: 1,
          notesImported: 3,
          documentsSkipped: 1,
        },
      });
      render(<AccountPage />, { wrapper: Wrapper });

      selectFile('{"applications":[]}');

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('ImportUserData'), {
          data: '{"applications":[]}',
        });
      });
      await waitFor(() => {
        expect(screen.getByText(/Imported 2 applications and 3 notes/)).toBeInTheDocument();
      });
      expect(screen.getByText(/Skipped 1 invalid application/)).toBeInTheDocument();
      expect(screen.getByText(/Skipped 1 document/)).toBeInTheDocument();
    });

    it('shows error message when import fails', async () => {
      mockGqlRequest.mockImplementation((query: unknown) => {
        if (typeof query === 'string' && query.includes('ImportUserData')) {
          return Promise.reject({
            response: { errors: [{ message: 'Import file is not valid JSON' }] },
          });
        }
        return Promise.resolve(defaultResponse);
      });
      render(<AccountPage />, { wrapper: Wrapper });

      selectFile('not json');

      await waitFor(() => {
        expect(screen.getByText('Import file is not valid JSON')).toBeInTheDocument();
      });
    });
  });

  describe('account deletion', () => {
    it('calls deleteAccount mutation, clears auth, and navigates to /login', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());
      mockGqlRequest.mockResolvedValue({ deleteAccount: true });

      const deleteBtn = screen.getByRole('button', { name: /delete my account/i });
      const form = deleteBtn.closest('form')!;
      const passwordInput = form.querySelector('input[type="password"]')!;

      fireEvent.change(passwordInput, { target: { value: 'myPassword123' } });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('DeleteAccount'), {
          password: 'myPassword123',
        });
        expect(mockClearAuthIndicator).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
      });
    });

    it('shows error message when deletion fails', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());
      mockGqlRequest.mockRejectedValue({
        response: { errors: [{ message: 'Invalid password' }] },
      });

      const deleteBtn = screen.getByRole('button', { name: /delete my account/i });
      const form = deleteBtn.closest('form')!;
      const passwordInput = form.querySelector('input[type="password"]')!;

      fireEvent.change(passwordInput, { target: { value: 'wrongPassword' } });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(screen.getByText('Invalid password')).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('linked accounts', () => {
    it('shows both providers as not linked, with a Link link to the start route', async () => {
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());

      const links = screen.getAllByRole('link', { name: /^link$/i });
      const hrefs = links.map((l) => l.getAttribute('href')).sort();
      expect(hrefs).toEqual([
        '/auth/oauth/github/start?mode=link',
        '/auth/oauth/google/start?mode=link',
      ]);
    });

    it('shows a linked provider with its email and an Unlink button', async () => {
      mockGqlRequest.mockResolvedValue({
        ...defaultResponse,
        linkedOAuthAccounts: [
          { provider: 'google', email: 'jeff@example.com', createdAt: '2024-01-01T00:00:00.000Z' },
        ],
      });
      render(<AccountPage />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('jeff@example.com')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /unlink/i })).toBeInTheDocument();
    });

    it('calls unlinkOAuthAccount when Unlink is clicked', async () => {
      mockGqlRequest.mockResolvedValue({
        ...defaultResponse,
        linkedOAuthAccounts: [
          { provider: 'google', email: 'jeff@example.com', createdAt: '2024-01-01T00:00:00.000Z' },
        ],
      });
      render(<AccountPage />, { wrapper: Wrapper });
      await waitFor(() => screen.getByRole('button', { name: /unlink/i }));

      fireEvent.click(screen.getByRole('button', { name: /unlink/i }));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('UnlinkOAuthAccount'), {
          provider: 'google',
        });
      });
    });
  });
});
