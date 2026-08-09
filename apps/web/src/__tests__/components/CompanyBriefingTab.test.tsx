import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

import { CompanyBriefingTab } from '#/routes/_authenticated/applications/$applicationId/-components/CompanyBriefingTab';

const makeClient = () => new QueryClient({ defaultOptions: { mutations: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

describe('CompanyBriefingTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
  });

  it('generates and displays a briefing', async () => {
    mockGqlRequest.mockResolvedValue({ generateCompanyBriefing: 'Company overview: Acme builds…' });
    render(<CompanyBriefingTab applicationId="app-1" />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /generate briefing/i }));

    await waitFor(() => {
      expect(screen.getByText(/Company overview: Acme builds/)).toBeInTheDocument();
    });
    expect(mockGqlRequest).toHaveBeenCalledWith(
      expect.stringContaining('GenerateCompanyBriefing'),
      expect.objectContaining({ applicationId: 'app-1' }),
    );
  });

  it('shows "Regenerate" after a successful generation', async () => {
    mockGqlRequest.mockResolvedValue({ generateCompanyBriefing: 'Briefing text' });
    render(<CompanyBriefingTab applicationId="app-1" />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /generate briefing/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();
    });
  });

  it('shows a link to Account settings when the AI key is not configured', async () => {
    mockGqlRequest.mockRejectedValue({
      response: { errors: [{ extensions: { code: 'AI_NOT_CONFIGURED' } }] },
    });
    render(<CompanyBriefingTab applicationId="app-1" />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /generate briefing/i }));

    await waitFor(() => {
      expect(screen.getByText(/add your ai api key/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /account settings/i })).toHaveAttribute(
      'href',
      '/settings/profile',
    );
  });

  it('copies the generated briefing to the clipboard', async () => {
    mockGqlRequest.mockResolvedValue({ generateCompanyBriefing: 'Briefing text' });
    render(<CompanyBriefingTab applicationId="app-1" />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /generate briefing/i }));
    await waitFor(() => {
      expect(screen.getByText('Briefing text')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Briefing text');
  });
});
