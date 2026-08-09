import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

import { DocumentVersionOutcomesPanel } from '#/routes/_authenticated/-document-version-outcomes-panel';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

const outcome = (overrides: Partial<Record<string, unknown>> = {}) => ({
  documentType: 'resume',
  version: 'v3',
  applicationCount: 12,
  interviewCount: 4,
  interviewRate: 33,
  ...overrides,
});

describe('DocumentVersionOutcomesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the empty-state guidance when there are no version outcomes', async () => {
    mockGqlRequest.mockResolvedValue({ documentVersionOutcomes: [] });
    render(<DocumentVersionOutcomesPanel />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/add a version label/i)).toBeInTheDocument();
    });
  });

  it('renders each version with its document type, counts, and rate', async () => {
    mockGqlRequest.mockResolvedValue({
      documentVersionOutcomes: [
        outcome({ documentType: 'resume', version: 'v3', applicationCount: 12, interviewCount: 4 }),
        outcome({
          documentType: 'cover_letter',
          version: 'v1',
          applicationCount: 5,
          interviewCount: 1,
          interviewRate: 20,
        }),
      ],
    });
    render(<DocumentVersionOutcomesPanel />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('v3')).toBeInTheDocument();
    });
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText('4/12 interviews')).toBeInTheDocument();
    expect(screen.getByText('Cover letter')).toBeInTheDocument();
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('1/5 interviews')).toBeInTheDocument();
  });

  it('shows "No version" for a null version', async () => {
    mockGqlRequest.mockResolvedValue({
      documentVersionOutcomes: [outcome({ version: null })],
    });
    render(<DocumentVersionOutcomesPanel />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('No version')).toBeInTheDocument();
    });
  });

  it('flags a low application count as a small sample', async () => {
    mockGqlRequest.mockResolvedValue({
      documentVersionOutcomes: [outcome({ applicationCount: 2, interviewCount: 1 })],
    });
    render(<DocumentVersionOutcomesPanel />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('small sample')).toBeInTheDocument();
    });
  });

  it('does not flag a small sample once the application count clears the threshold', async () => {
    mockGqlRequest.mockResolvedValue({
      documentVersionOutcomes: [outcome({ applicationCount: 3, interviewCount: 1 })],
    });
    render(<DocumentVersionOutcomesPanel />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('v3')).toBeInTheDocument();
    });
    expect(screen.queryByText('small sample')).not.toBeInTheDocument();
  });

  it('renders nothing when the query fails', async () => {
    mockGqlRequest.mockRejectedValue(new Error('Network error'));
    const { container } = render(<DocumentVersionOutcomesPanel />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });
});
