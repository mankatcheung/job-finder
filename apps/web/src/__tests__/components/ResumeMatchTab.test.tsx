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

import { ResumeMatchTab } from '#/routes/_authenticated/applications/$applicationId/-components/ResumeMatchTab';

const makeClient = () => new QueryClient({ defaultOptions: { mutations: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

const scoreResult = {
  score: 82,
  label: 'Good match',
  matchedKeywords: ['TypeScript', 'GraphQL'],
  missingKeywords: ['Kubernetes'],
  summary: 'Strong overlap on core skills.',
};

const resumeDoc = {
  id: 'doc-1',
  applicationId: 'app-1',
  name: 'resume.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 1000,
  url: 'https://example.com/resume.pdf',
  documentType: 'resume',
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('ResumeMatchTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prompts for pasted resume text when there is no uploaded resume', async () => {
    mockGqlRequest.mockResolvedValue({ documents: [] });
    render(<ResumeMatchTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/paste your resume text/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /check match/i })).toBeDisabled();
  });

  it('uses the uploaded resume automatically when one exists', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Documents')) return Promise.resolve({ documents: [resumeDoc] });
      return Promise.resolve({});
    });
    render(<ResumeMatchTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/using your uploaded resume/i)).toBeInTheDocument();
    });
    expect(screen.getByText('resume.pdf')).toBeInTheDocument();
  });

  it('computes and displays a match score using the uploaded resume', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Documents')) return Promise.resolve({ documents: [resumeDoc] });
      if (query.includes('ComputeResumeMatchScore')) {
        return Promise.resolve({ computeResumeMatchScore: scoreResult });
      }
      return Promise.resolve({});
    });
    render(<ResumeMatchTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/using your uploaded resume/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /check match/i }));

    await waitFor(() => {
      expect(screen.getByText('Good match')).toBeInTheDocument();
    });
    expect(mockGqlRequest).toHaveBeenCalledWith(
      expect.stringContaining('ComputeResumeMatchScore'),
      expect.objectContaining({ applicationId: 'app-1', resumeText: null }),
    );
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
    expect(screen.getByText('Strong overlap on core skills.')).toBeInTheDocument();
  });

  it('computes a match score from pasted text when there is no uploaded resume', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Documents')) return Promise.resolve({ documents: [] });
      if (query.includes('ComputeResumeMatchScore')) {
        return Promise.resolve({ computeResumeMatchScore: scoreResult });
      }
      return Promise.resolve({});
    });
    render(<ResumeMatchTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/paste your resume text/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/paste your resume text/i), {
      target: { value: 'My resume content' },
    });
    fireEvent.click(screen.getByRole('button', { name: /check match/i }));

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('ComputeResumeMatchScore'),
        expect.objectContaining({ resumeText: 'My resume content' }),
      );
    });
  });

  it('shows a link to Account settings when the AI key is not configured', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Documents')) return Promise.resolve({ documents: [] });
      if (query.includes('ComputeResumeMatchScore')) {
        return Promise.reject({
          response: { errors: [{ extensions: { code: 'AI_NOT_CONFIGURED' } }] },
        });
      }
      return Promise.resolve({});
    });
    render(<ResumeMatchTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/paste your resume text/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText(/paste your resume text/i), {
      target: { value: 'resume text' },
    });
    fireEvent.click(screen.getByRole('button', { name: /check match/i }));

    await waitFor(() => {
      expect(screen.getByText(/add your ai api key/i)).toBeInTheDocument();
    });
  });
});
