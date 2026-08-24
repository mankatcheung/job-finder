import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

const { mockHasSessionCookie } = vi.hoisted(() => ({
  mockHasSessionCookie: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: { children: ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('#/graphql/client', () => ({
  hasSessionCookie: mockHasSessionCookie,
}));

vi.mock('#/lib/theme', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

vi.mock('#/lib/i18n', () => ({
  useLocale: () => ({
    t: (key: string) =>
      ({
        'landing.features': 'Features',
        'landing.signIn': 'Sign in',
        'landing.goDashboard': 'Go to dashboard',
        'landing.getStarted': 'Get started',
      })[key] ?? key,
  }),
}));

import { MarketingHeader } from '#/components/marketing/MarketingHeader';

describe('MarketingHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('links Features to /features', () => {
    mockHasSessionCookie.mockReturnValue(false);
    render(<MarketingHeader />);

    expect(screen.getByRole('link', { name: 'Features' })).toHaveAttribute('href', '/features');
  });

  it('bolds the Features link when activeFeatures is set', () => {
    mockHasSessionCookie.mockReturnValue(false);
    render(<MarketingHeader activeFeatures />);

    expect(screen.getByRole('link', { name: 'Features' }).className).toContain('font-semibold');
  });

  it('does not bold the Features link outside /features', () => {
    mockHasSessionCookie.mockReturnValue(false);
    render(<MarketingHeader />);

    expect(screen.getByRole('link', { name: 'Features' }).className).not.toContain('font-semibold');
  });

  it('shows "Sign in" pointing at /login for a logged-out visitor', () => {
    mockHasSessionCookie.mockReturnValue(false);
    render(<MarketingHeader />);

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  it('shows "Go to dashboard" pointing at /dashboard once a session is detected', () => {
    mockHasSessionCookie.mockReturnValue(true);
    render(<MarketingHeader />);

    expect(screen.getByRole('link', { name: 'Go to dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });

  it('links Get started to /register', () => {
    mockHasSessionCookie.mockReturnValue(false);
    render(<MarketingHeader />);

    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/register');
  });

  it('renders a theme toggle button, once for desktop and once for mobile', () => {
    mockHasSessionCookie.mockReturnValue(false);
    render(<MarketingHeader />);

    // One in the desktop nav row, one beside the mobile hamburger — both
    // always rendered, shown/hidden purely by the `sm:` breakpoint classes.
    expect(screen.getAllByRole('button', { name: /theme/i })).toHaveLength(2);
  });
});
