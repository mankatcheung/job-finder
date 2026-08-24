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

import { FeatureAiAssistantPage } from '#/routes/features/-components/FeatureAiAssistantPage';

describe('FeatureAiAssistantPage', () => {
  it('renders the headline and the sample conversation', () => {
    render(<FeatureAiAssistantPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'An assistant that knows your job search' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/haven.?t heard back in 2 weeks/i)).toBeInTheDocument();
  });

  it('renders the three benefit sections', () => {
    render(<FeatureAiAssistantPage />);

    expect(screen.getByRole('heading', { name: 'Grounded in your data' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bring your own AI key' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'A history you can return to' }),
    ).toBeInTheDocument();
  });
});
