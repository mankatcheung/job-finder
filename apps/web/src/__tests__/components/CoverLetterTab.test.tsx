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

import { CoverLetterTab } from '#/routes/_authenticated/applications/$applicationId/-components/CoverLetterTab';

const makeClient = () => new QueryClient({ defaultOptions: { mutations: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

describe('CoverLetterTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
  });

  it('generates and displays a cover letter', async () => {
    mockGqlRequest.mockResolvedValue({ generateCoverLetter: 'Dear Hiring Manager,\n\nHello.' });
    render(<CoverLetterTab applicationId="app-1" />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /generate cover letter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Dear Hiring Manager/)).toBeInTheDocument();
    });
    expect(mockGqlRequest).toHaveBeenCalledWith(
      expect.stringContaining('GenerateCoverLetter'),
      expect.objectContaining({ applicationId: 'app-1', resumeText: null }),
    );
  });

  it('passes pasted resume text through to the mutation', async () => {
    mockGqlRequest.mockResolvedValue({ generateCoverLetter: 'Letter body' });
    render(<CoverLetterTab applicationId="app-1" />, { wrapper: Wrapper });

    fireEvent.change(screen.getByPlaceholderText(/paste your resume/i), {
      target: { value: 'My background' },
    });
    fireEvent.click(screen.getByRole('button', { name: /generate cover letter/i }));

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ resumeText: 'My background' }),
      );
    });
  });

  it('shows a link to Account settings when the AI key is not configured', async () => {
    mockGqlRequest.mockRejectedValue({
      response: { errors: [{ extensions: { code: 'AI_NOT_CONFIGURED' } }] },
    });
    render(<CoverLetterTab applicationId="app-1" />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /generate cover letter/i }));

    await waitFor(() => {
      expect(screen.getByText(/add your ai api key/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /account settings/i })).toHaveAttribute(
      'href',
      '/settings/profile',
    );
  });

  it('shows the raw error message for a non-AI-key error', async () => {
    mockGqlRequest.mockRejectedValue(new Error('Something went wrong'));
    render(<CoverLetterTab applicationId="app-1" />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /generate cover letter/i }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('copies the generated letter to the clipboard', async () => {
    mockGqlRequest.mockResolvedValue({ generateCoverLetter: 'Letter body' });
    render(<CoverLetterTab applicationId="app-1" />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole('button', { name: /generate cover letter/i }));
    await waitFor(() => {
      expect(screen.getByText('Letter body')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Letter body');
  });
});
