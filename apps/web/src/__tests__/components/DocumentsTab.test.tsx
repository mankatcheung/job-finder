import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
  }) => <a href={`${to}${params ? '/' + Object.values(params).join('/') : ''}`}>{children}</a>,
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

vi.mock('#/lib/undoToast', () => ({
  // Sends the operation the call site handed over, instead of running an
  // opaque callback. The request is now described as data so it can be
  // replayed after a refresh (JEF-191), which means this mock also checks
  // that each call site names the right document and variables.
  showUndoToast: vi.fn(
    ({
      operation,
      onSettled,
    }: {
      operation: { document: string; variables?: Record<string, unknown> };
      onSettled?: () => void;
    }) => {
      void Promise.resolve(mockGqlRequest(operation.document, operation.variables))
        .catch(() => {})
        .finally(() => onSettled?.());
    },
  ),
}));

vi.mock('@vercel/blob/client', () => ({
  put: vi.fn(),
}));

import { DocumentsTab } from '#/routes/_authenticated/applications/$applicationId/-components/DocumentsTab';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

const mockDoc = {
  id: 'doc-1',
  applicationId: 'app-1',
  name: 'resume.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 102400,
  url: 'https://example.com/resume.pdf',
  documentType: 'resume',
  version: null,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockDraft = {
  id: 'draft-1',
  applicationId: 'app-1',
  type: 'cover_letter',
  title: 'My cover letter',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function mockResponses(overrides?: { documents?: unknown[]; documentDrafts?: unknown[] }) {
  mockGqlRequest.mockImplementation((query: string) => {
    if (query.includes('DocumentDrafts')) {
      return Promise.resolve({ documentDrafts: overrides?.documentDrafts ?? [] });
    }
    return Promise.resolve({ documents: overrides?.documents ?? [] });
  });
}

describe('DocumentsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the upload prompt when there are no documents', async () => {
    mockResponses();
    render(<DocumentsTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
    });
  });

  it('renders an existing document with its type and size', async () => {
    mockResponses({ documents: [mockDoc] });
    render(<DocumentsTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'resume.pdf' })).toBeInTheDocument();
    });
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText(/100\.0 KB/)).toBeInTheDocument();
  });

  it('renders an existing document draft with a link to it', async () => {
    mockResponses({ documentDrafts: [mockDraft] });
    render(<DocumentsTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('My cover letter')).toBeInTheDocument();
    });
    const link = screen.getByText('My cover letter').closest('a')!;
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('/applications/$applicationId/documents/$draftId'),
    );
  });

  it('deletes a document', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('DeleteDocument')) return Promise.resolve({ deleteDocument: true });
      if (query.includes('DocumentDrafts')) return Promise.resolve({ documentDrafts: [] });
      return Promise.resolve({ documents: [mockDoc] });
    });
    render(<DocumentsTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'resume.pdf' })).toBeInTheDocument();
    });

    const row = screen.getByRole('button', { name: 'resume.pdf' }).closest('div')!.parentElement!
      .parentElement!;
    const buttons = within(row).getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('DeleteDocument'),
        expect.objectContaining({ id: 'doc-1' }),
      );
    });
  });

  it('shows the server quota message when an upload is rejected', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('DocumentDrafts')) return Promise.resolve({ documentDrafts: [] });
      if (query.includes('RequestUploadUrl')) {
        return Promise.reject({
          response: {
            errors: [
              {
                message: 'This application already has the maximum of 10 documents',
                extensions: { code: 'QUOTA_EXCEEDED' },
              },
            ],
          },
        });
      }
      return Promise.resolve({ documents: [] });
    });
    const { container } = render(<DocumentsTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText(/click to upload/i)).toBeInTheDocument());
    const input = container.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(['pdf'], 'resume.pdf', { type: 'application/pdf' })] },
    });

    await waitFor(() =>
      expect(
        screen.getByText('This application already has the maximum of 10 documents'),
      ).toBeInTheDocument(),
    );
  });
});
