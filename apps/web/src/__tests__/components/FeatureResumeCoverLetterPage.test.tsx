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

import { FeatureResumeCoverLetterPage } from '#/routes/features/-components/FeatureResumeCoverLetterPage';

describe('FeatureResumeCoverLetterPage', () => {
  it('renders the headline and the grounding guarantee', () => {
    render(<FeatureResumeCoverLetterPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Tailored to the job — not invented' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Grounded, not invented')).toBeInTheDocument();
  });

  it('renders the three benefit sections', () => {
    render(<FeatureResumeCoverLetterPage />);

    expect(
      screen.getByRole('heading', { name: 'Grounded, not generated from thin air' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tailored to the role' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Yours to refine' })).toBeInTheDocument();
  });
});
