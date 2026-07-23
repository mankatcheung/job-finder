import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockNavigate, mockGqlRequest, mockClearAuthIndicator } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGqlRequest: vi.fn(),
  mockClearAuthIndicator: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => opts,
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

import { AccountPage } from '#/routes/_authenticated/account';

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Login history loads in the background on every mount — give it a benign
    // default so tests that don't care about it don't have to stub it out.
    mockGqlRequest.mockImplementation((query: unknown) => {
      if (typeof query === 'string' && query.includes('LoginHistory')) {
        return Promise.resolve({ loginHistory: [] });
      }
      return Promise.resolve(undefined);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all sections', () => {
    render(<AccountPage />);
    expect(screen.getByText('Account settings')).toBeInTheDocument();
    expect(screen.getByText('Email address')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Recent login activity')).toBeInTheDocument();
    expect(screen.getByText('Export your data')).toBeInTheDocument();
    expect(screen.getByText('Danger zone')).toBeInTheDocument();
  });

  describe('email update form', () => {
    it('calls updateEmail mutation with current password and new email', async () => {
      mockGqlRequest.mockResolvedValue({ updateEmail: true });
      render(<AccountPage />);

      const updateEmailBtn = screen.getByRole('button', { name: /update email/i });
      const form = updateEmailBtn.closest('form')!;
      const pwInput = form.querySelector('input[type="password"]')!;
      const emailInput = form.querySelector('input[type="email"]')!;

      fireEvent.change(pwInput, { target: { value: 'mypassword' } });
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
      fireEvent.click(updateEmailBtn);

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('UpdateEmail'), {
          currentPassword: 'mypassword',
          newEmail: 'new@example.com',
        });
      });
    });

    it('shows error message on email update failure', async () => {
      mockGqlRequest.mockImplementation((query: unknown) => {
        if (typeof query === 'string' && query.includes('LoginHistory')) {
          return Promise.resolve({ loginHistory: [] });
        }
        return Promise.reject({ response: { errors: [{ message: 'Email already in use' }] } });
      });
      render(<AccountPage />);

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

  describe('password update form', () => {
    it('shows validation error when new passwords do not match', async () => {
      render(<AccountPage />);

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
      mockGqlRequest.mockResolvedValue({ updatePassword: true });
      render(<AccountPage />);

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
      mockGqlRequest.mockRejectedValue(new Error('network error'));
      render(<AccountPage />);

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
        return Promise.resolve(undefined);
      });

      render(<AccountPage />);

      await waitFor(() => {
        expect(screen.getByText(/Mac · 203.0.113.5/)).toBeInTheDocument();
      });
    });

    it('shows a message when there is no login history', async () => {
      render(<AccountPage />);

      await waitFor(() => {
        expect(screen.getByText('No login activity yet.')).toBeInTheDocument();
      });
    });

    it('shows an error message when login history fails to load', async () => {
      mockGqlRequest.mockImplementation((query: unknown) => {
        if (typeof query === 'string' && query.includes('LoginHistory')) {
          return Promise.reject(new Error('network error'));
        }
        return Promise.resolve(undefined);
      });

      render(<AccountPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load login history.')).toBeInTheDocument();
      });
    });
  });

  describe('data export', () => {
    it('calls exportUserData and triggers download on success', async () => {
      mockGqlRequest.mockResolvedValue({ exportUserData: '{"applications":[]}' });
      const mockRevokeObjectURL = vi.fn();
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(mockRevokeObjectURL);

      render(<AccountPage />);
      fireEvent.click(screen.getByRole('button', { name: /download export/i }));

      await waitFor(() => {
        expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('exportUserData'));
      });
      await waitFor(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      });
    });
  });

  describe('account deletion', () => {
    it('calls deleteAccount mutation, clears auth, and navigates to /login', async () => {
      mockGqlRequest.mockResolvedValue({ deleteAccount: true });
      render(<AccountPage />);

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
      mockGqlRequest.mockImplementation((query: unknown) => {
        if (typeof query === 'string' && query.includes('LoginHistory')) {
          return Promise.resolve({ loginHistory: [] });
        }
        return Promise.reject({ response: { errors: [{ message: 'Invalid password' }] } });
      });
      render(<AccountPage />);

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
});
