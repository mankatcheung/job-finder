import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const { mockGqlRequest, mockGetRequiresCookieConsent } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
  mockGetRequiresCookieConsent: vi.fn(),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

vi.mock('#/lib/consentRegion', () => ({
  getRequiresCookieConsent: mockGetRequiresCookieConsent,
}));

vi.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="analytics" />,
}));

import { CookieConsent } from '#/components/CookieConsent';
import { requestOpenCookiePreferences } from '#/lib/cookieConsent';

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
    mockGqlRequest.mockReset().mockResolvedValue({ recordCookieConsent: true });
    mockGetRequiresCookieConsent.mockReset();
  });

  it('loads analytics immediately outside a consent-required region, with no banner', async () => {
    mockGetRequiresCookieConsent.mockResolvedValue(false);
    render(<CookieConsent />);

    await waitFor(() => expect(screen.getByTestId('analytics')).toBeInTheDocument());
    expect(screen.queryByText(/necessary cookies to keep you signed in/i)).not.toBeInTheDocument();
  });

  it('shows the banner and blocks analytics in a consent-required region with no prior choice', async () => {
    mockGetRequiresCookieConsent.mockResolvedValue(true);
    render(<CookieConsent />);

    await waitFor(() =>
      expect(screen.getByText(/necessary cookies to keep you signed in/i)).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('analytics')).not.toBeInTheDocument();
  });

  it('does not show the banner when a choice is already stored, even in a consent-required region', async () => {
    localStorage.setItem(
      'trakwyn_cookie_consent',
      JSON.stringify({ analytics: true, consentedAt: new Date().toISOString() }),
    );
    mockGetRequiresCookieConsent.mockResolvedValue(true);
    render(<CookieConsent />);

    await waitFor(() => expect(screen.getByTestId('analytics')).toBeInTheDocument());
    expect(screen.queryByText(/necessary cookies to keep you signed in/i)).not.toBeInTheDocument();
  });

  it('respects a stored rejection by keeping analytics blocked', async () => {
    localStorage.setItem(
      'trakwyn_cookie_consent',
      JSON.stringify({ analytics: false, consentedAt: new Date().toISOString() }),
    );
    mockGetRequiresCookieConsent.mockResolvedValue(true);
    render(<CookieConsent />);

    await waitFor(() => expect(mockGetRequiresCookieConsent).toHaveBeenCalled());
    expect(screen.queryByTestId('analytics')).not.toBeInTheDocument();
  });

  it('"Accept all" dismisses the banner, loads analytics, and records the choice', async () => {
    mockGetRequiresCookieConsent.mockResolvedValue(true);
    render(<CookieConsent />);

    fireEvent.click(await screen.findByRole('button', { name: /accept all/i }));

    await waitFor(() => expect(screen.getByTestId('analytics')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /accept all/i })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('recordCookieConsent'), {
        analyticsAccepted: true,
      }),
    );
  });

  it('"Reject non-essential" dismisses the banner without loading analytics', async () => {
    mockGetRequiresCookieConsent.mockResolvedValue(true);
    render(<CookieConsent />);

    fireEvent.click(await screen.findByRole('button', { name: /reject non-essential/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /reject non-essential/i }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.queryByTestId('analytics')).not.toBeInTheDocument();
  });

  it('"Manage preferences" opens a panel that saves the chosen category', async () => {
    mockGetRequiresCookieConsent.mockResolvedValue(true);
    render(<CookieConsent />);

    fireEvent.click(await screen.findByRole('button', { name: /manage preferences/i }));

    const analyticsToggle = await screen.findByRole('checkbox', { name: /^analytics$/i });
    expect(analyticsToggle).not.toBeChecked();
    fireEvent.click(analyticsToggle);
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => expect(screen.getByTestId('analytics')).toBeInTheDocument());
  });

  it('the "Necessary" category is always on and cannot be unchecked', async () => {
    mockGetRequiresCookieConsent.mockResolvedValue(true);
    render(<CookieConsent />);

    fireEvent.click(await screen.findByRole('button', { name: /manage preferences/i }));

    const necessaryToggle = await screen.findByRole('checkbox', { name: /^necessary$/i });
    expect(necessaryToggle).toBeChecked();
    expect(necessaryToggle).toBeDisabled();
  });

  it('reopens the preferences panel when requestOpenCookiePreferences is dispatched, regardless of region', async () => {
    localStorage.setItem(
      'trakwyn_cookie_consent',
      JSON.stringify({ analytics: false, consentedAt: new Date().toISOString() }),
    );
    mockGetRequiresCookieConsent.mockResolvedValue(false);
    render(<CookieConsent />);

    await waitFor(() => expect(mockGetRequiresCookieConsent).toHaveBeenCalled());
    requestOpenCookiePreferences();

    expect(await screen.findByRole('button', { name: /save preferences/i })).toBeInTheDocument();
  });
});
