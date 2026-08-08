import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockNavigate, mockGqlRequest, mockSetAccessToken } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGqlRequest: vi.fn(),
  mockSetAccessToken: vi.fn(),
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
  setAccessToken: mockSetAccessToken,
}));

vi.mock('#/lib/queryClient', () => ({
  queryClient: { clear: vi.fn(), resetQueries: vi.fn() },
}));

vi.mock('@vercel/blob/client', () => ({
  put: vi.fn(),
}));

import { ThemeProvider } from '#/lib/theme';
import { SettingsDataPage } from '#/routes/_authenticated/settings/-components/SettingsDataPage';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}

describe('SettingsDataPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGqlRequest.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('data export', () => {
    it('calls exportUserData and triggers download on success', async () => {
      mockGqlRequest.mockResolvedValue({ exportUserData: '{"applications":[]}' });
      const mockRevokeObjectURL = vi.fn();
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(mockRevokeObjectURL);

      render(<SettingsDataPage />, { wrapper: Wrapper });
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
      render(<SettingsDataPage />, { wrapper: Wrapper });

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
        return Promise.resolve({});
      });
      render(<SettingsDataPage />, { wrapper: Wrapper });

      selectFile('not json');

      await waitFor(() => {
        expect(screen.getByText('Import file is not valid JSON')).toBeInTheDocument();
      });
    });
  });

  describe('account deletion', () => {
    it('calls deleteAccount mutation, clears auth, and navigates to /login', async () => {
      render(<SettingsDataPage />, { wrapper: Wrapper });
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
        expect(mockSetAccessToken).toHaveBeenCalledWith(null);
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
      });
    });

    it('shows error message when deletion fails', async () => {
      render(<SettingsDataPage />, { wrapper: Wrapper });
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

    it('prompts for reauth on STEP_UP_REQUIRED, then retries deletion on success (JEF-44)', async () => {
      render(<SettingsDataPage />, { wrapper: Wrapper });
      mockGqlRequest.mockRejectedValueOnce({
        response: {
          errors: [
            {
              message: 'Please verify your identity again to continue.',
              extensions: { code: 'STEP_UP_REQUIRED' },
            },
          ],
        },
      });
      mockGqlRequest.mockResolvedValueOnce({
        reauthenticate: { success: true, totpRequired: false, accessToken: 'new-access-token' },
      });
      mockGqlRequest.mockResolvedValueOnce({ deleteAccount: true });

      const deleteBtn = screen.getByRole('button', { name: /delete my account/i });
      const form = deleteBtn.closest('form')!;
      fireEvent.change(form.querySelector('input[type="password"]')!, {
        target: { value: 'myPassword123' },
      });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(screen.getByText("Confirm it's you")).toBeInTheDocument();
      });

      const dialog = screen.getByText("Confirm it's you").closest('div')!.parentElement!;
      fireEvent.change(dialog.querySelector('input[type="password"]')!, {
        target: { value: 'myPassword123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
      });
      expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('Reauthenticate'), {
        password: 'myPassword123',
        code: undefined,
      });
      expect(mockSetAccessToken).toHaveBeenCalledWith('new-access-token');
      expect(mockSetAccessToken).toHaveBeenCalledWith(null);
    });
  });
});
