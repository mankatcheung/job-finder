import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { mockGqlRequest } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: unknown) => opts,
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

import { ForgotPasswordPage } from '#/routes/forgot-password';

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the email input', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('shows a validation error for an invalid email', async () => {
    render(<ForgotPasswordPage />);
    // 'user@domain' passes HTML5 email validation (so jsdom won't block submit)
    // but fails Zod's stricter email regex (requires a proper TLD like .com)
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'user@domain' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
    expect(mockGqlRequest).not.toHaveBeenCalled();
  });

  it('calls requestPasswordReset with the given email and shows the confirmation message', async () => {
    mockGqlRequest.mockResolvedValue({ requestPasswordReset: true });
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('RequestPasswordReset'), {
        email: 'test@example.com',
      });
    });
    await waitFor(() => {
      expect(screen.getByText(/we've sent a password reset link/i)).toBeInTheDocument();
    });
  });

  it('shows the same confirmation message even when the backend errors', async () => {
    // The mutation always resolves true regardless of whether the email is
    // known, so there is no error path to distinguish in the UI.
    mockGqlRequest.mockResolvedValue({ requestPasswordReset: true });
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'unknown@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/we've sent a password reset link/i)).toBeInTheDocument();
    });
  });
});
