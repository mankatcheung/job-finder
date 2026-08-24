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
  LOCALE_OPTIONS: [{ value: 'en', label: 'English' }],
  useLocale: () => ({
    locale: 'en',
    setLocale: vi.fn(),
    t: (key: string) =>
      ({
        'landing.features': 'Features',
        'landing.signIn': 'Sign in',
        'landing.getStarted': 'Get started',
        'auth.register': 'Register',
      })[key] ?? key,
  }),
}));

import { FeatureTrackingPage } from '#/routes/features/-components/FeatureTrackingPage';

describe('FeatureTrackingPage', () => {
  it('renders the headline and every board status column', () => {
    render(<FeatureTrackingPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Every application, one board' }),
    ).toBeInTheDocument();
    ['draft', 'applied', 'interviewing', 'offered', 'accepted', 'rejected', 'withdrawn'].forEach(
      (status) => {
        expect(screen.getByText(status)).toBeInTheDocument();
      },
    );
  });

  it('renders the three benefit sections', () => {
    render(<FeatureTrackingPage />);

    expect(screen.getByRole('heading', { name: 'Add a job in seconds' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Board or list — your call' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nothing slips through' })).toBeInTheDocument();
  });
});
