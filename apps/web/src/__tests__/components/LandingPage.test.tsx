import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

const { mockHasSessionCookie, mockRedirect } = vi.hoisted(() => ({
  mockHasSessionCookie: vi.fn(),
  mockRedirect: vi.fn((opts: unknown) => opts),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: object) => options,
  redirect: mockRedirect,
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

import { LandingPage, Route } from '#/routes/index';

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
});

describe('index route beforeLoad', () => {
  // The mocked createFileRoute() (unlike the real one) returns the raw
  // options object, so `beforeLoad` lives directly on `Route` at runtime —
  // not under `Route.options` as the real type would suggest.
  const { beforeLoad } = Route as unknown as { beforeLoad: () => void };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /dashboard when a session already exists', () => {
    mockHasSessionCookie.mockReturnValue(true);

    expect(() => beforeLoad()).toThrow();
    expect(mockRedirect).toHaveBeenCalledWith({ to: '/dashboard' });
  });

  it('does not redirect logged-out users', () => {
    mockHasSessionCookie.mockReturnValue(false);

    expect(() => beforeLoad()).not.toThrow();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
