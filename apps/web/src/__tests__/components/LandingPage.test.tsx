import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

const { mockHasSessionCookie } = vi.hoisted(() => ({
  mockHasSessionCookie: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: object) => options,
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

  it('remains accessible when a session exists', () => {
    mockHasSessionCookie.mockReturnValue(true);

    render(<LandingPage />);

    expect(Route).not.toHaveProperty('beforeLoad');
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
});
