import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

const { mockHasSessionCookie, mockNavigate } = vi.hoisted(() => ({
  mockHasSessionCookie: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: object) => options,
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('#/graphql/client', () => ({
  hasSessionCookie: mockHasSessionCookie,
}));

vi.mock('#/lib/i18n', () => ({
  useLocale: () => ({
    t: (key: string) =>
      ({
        'landing.signIn': 'Sign in',
        'landing.goDashboard': 'Go to dashboard',
        'landing.getStarted': 'Get started',
        'landing.startFree': 'Start for free',
        'landing.getStartedFree': 'Get started for free',
      })[key] ?? key,
  }),
}));

import { LandingPage } from '#/routes/index';

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows dashboard links when rendered while a session exists', () => {
    mockHasSessionCookie.mockReturnValue(true);

    render(<LandingPage />);

    expect(screen.getAllByRole('link', { name: 'Go to dashboard' })).toHaveLength(3);
    expect(screen.queryAllByRole('link', { name: 'Sign in' })).toHaveLength(0);
    screen
      .getAllByRole('link', { name: 'Go to dashboard' })
      .forEach((link) => expect(link).toHaveAttribute('href', '/dashboard'));
  });

  it('keeps sign-in links for logged-out users', () => {
    mockHasSessionCookie.mockReturnValue(false);

    render(<LandingPage />);

    expect(screen.getAllByRole('link', { name: 'Sign in' })).toHaveLength(3);
    expect(screen.queryAllByRole('link', { name: 'Go to dashboard' })).toHaveLength(0);
    screen
      .getAllByRole('link', { name: 'Sign in' })
      .forEach((link) => expect(link).toHaveAttribute('href', '/login'));
  });

  it('links to the Privacy Policy and Terms of Service in the footer', () => {
    mockHasSessionCookie.mockReturnValue(false);

    render(<LandingPage />);

    expect(screen.getByRole('link', { name: 'auth.privacyPolicy' })).toHaveAttribute(
      'href',
      '/privacy',
    );
    expect(screen.getByRole('link', { name: 'auth.termsOfService' })).toHaveAttribute(
      'href',
      '/terms',
    );
  });

  describe('already-logged-in redirect', () => {
    it('navigates to /dashboard on mount when a session already exists', () => {
      mockHasSessionCookie.mockReturnValue(true);

      render(<LandingPage />);

      expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard', replace: true });
    });

    it('does not navigate away for logged-out users', () => {
      mockHasSessionCookie.mockReturnValue(false);

      render(<LandingPage />);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
