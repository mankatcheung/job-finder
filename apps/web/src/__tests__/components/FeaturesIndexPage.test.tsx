import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: { children: ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('#/graphql/client', () => ({ hasSessionCookie: () => false }));
vi.mock('#/lib/theme', () => ({ useTheme: () => ({ theme: 'light', setTheme: vi.fn() }) }));

vi.mock('#/lib/i18n', () => ({
  useLocale: () => ({
    t: (key: string) =>
      ({
        'landing.features': 'Features',
        'landing.signIn': 'Sign in',
        'landing.getStarted': 'Get started',
        'auth.register': 'Register',
      })[key] ?? key,
  }),
}));

import { FeaturesIndexPage } from '#/routes/features/-components/FeaturesIndexPage';

describe('FeaturesIndexPage', () => {
  it('links each deep-dive card to its feature page', () => {
    render(<FeaturesIndexPage />);

    expect(screen.getByRole('link', { name: /Explore application tracking/ })).toHaveAttribute(
      'href',
      '/features/tracking',
    );
    expect(screen.getByRole('link', { name: /Explore the AI assistant/ })).toHaveAttribute(
      'href',
      '/features/ai-assistant',
    );
    expect(screen.getByRole('link', { name: /Explore resume/ })).toHaveAttribute(
      'href',
      '/features/resume-cover-letter',
    );
    expect(screen.getByRole('link', { name: /Explore analytics/ })).toHaveAttribute(
      'href',
      '/features/analytics',
    );
  });

  it('lists the non-deep-dive features as brief entries', () => {
    render(<FeaturesIndexPage />);

    [
      'Calendar & reminders',
      'Contacts',
      'Documents',
      'Notifications',
      'Security',
      'Bring your own AI key',
      'Browser extension',
      '5 languages',
    ].forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('links the closing CTA to /register', () => {
    render(<FeaturesIndexPage />);

    expect(screen.getByRole('link', { name: 'Get started free' })).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
