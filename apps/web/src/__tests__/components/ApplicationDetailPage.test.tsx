import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockNavigate, mockGqlRequest } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGqlRequest: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => ({
    ...opts,
    useParams: () => ({ applicationId: 'app-test-id' }),
  }),
  useNavigate: () => mockNavigate,
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
  showUndoToast: vi.fn(({ onExecute }) => {
    onExecute();
  }),
}));

import { ApplicationDetailPage } from '#/routes/_authenticated/applications/$applicationId/index';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

const mockApp = {
  id: 'app-test-id',
  company: 'Stripe',
  role: 'Software Engineer',
  status: 'applied',
  jobUrl: 'https://stripe.com/jobs/1',
  location: 'Remote',
  salaryRange: '$150k',
  description: 'Great role',
  appliedAt: '2024-03-01T00:00:00.000Z',
  starred: false,
  source: null,
  followUpAt: null,
  tags: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockNotes = [
  {
    id: 'note-1',
    applicationId: 'app-test-id',
    content: 'Great first interview',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

describe('ApplicationDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton when data is not yet available', () => {
    mockGqlRequest.mockReturnValue(new Promise(() => {}));
    render(<ApplicationDetailPage />, { wrapper: Wrapper });
    // Loading state - skeleton is shown, no app data
    expect(screen.queryByText('Stripe')).not.toBeInTheDocument();
  });

  it('renders application company and role when data loads', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Notes')) return Promise.resolve({ notes: [] });
      return Promise.resolve({ application: mockApp });
    });
    render(<ApplicationDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
    });
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('renders application metadata', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Notes')) return Promise.resolve({ notes: [] });
      return Promise.resolve({ application: mockApp });
    });
    render(<ApplicationDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Remote')).toBeInTheDocument();
    });
    expect(screen.getByText('$150k')).toBeInTheDocument();
  });

  it('renders existing notes', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Notes')) return Promise.resolve({ notes: mockNotes });
      return Promise.resolve({ application: mockApp });
    });
    render(<ApplicationDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Great first interview')).toBeInTheDocument();
    });
  });

  it('submits a new note', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('CreateNote')) {
        return Promise.resolve({
          createNote: {
            id: 'note-2',
            applicationId: 'app-test-id',
            content: 'New note',
            createdAt: '2024-01-03T00:00:00.000Z',
            updatedAt: '2024-01-03T00:00:00.000Z',
          },
        });
      }
      if (query.includes('Notes')) return Promise.resolve({ notes: [] });
      return Promise.resolve({ application: mockApp });
    });
    render(<ApplicationDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/add a note/i);
    fireEvent.change(textarea, { target: { value: 'New note content' } });
    fireEvent.click(screen.getByRole('button', { name: /add note/i }));

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('CreateNote'),
        expect.objectContaining({ content: 'New note content' }),
      );
    });
  });

  it('shows the notes and documents tabs', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Notes')) return Promise.resolve({ notes: [] });
      return Promise.resolve({ application: mockApp });
    });
    render(<ApplicationDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
    });

    expect(
      within(screen.getByLabelText('Section navigation')).getByRole('button', { name: /notes/i }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText('Section navigation')).getByRole('button', {
        name: /documents/i,
      }),
    ).toBeInTheDocument();
  });

  it('switches to documents tab and shows upload area', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Documents')) return Promise.resolve({ documents: [] });
      if (query.includes('Notes')) return Promise.resolve({ notes: [] });
      return Promise.resolve({ application: mockApp });
    });
    render(<ApplicationDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
    });

    fireEvent.click(
      within(screen.getByLabelText('Section navigation')).getByRole('button', {
        name: /documents/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
    });
  });

  it('renders existing documents in documents tab', async () => {
    const mockDoc = {
      id: 'doc-1',
      applicationId: 'app-test-id',
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 102400,
      url: 'https://example.com/resume.pdf',
      createdAt: '2024-01-02T00:00:00.000Z',
    };
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Documents')) return Promise.resolve({ documents: [mockDoc] });
      if (query.includes('Notes')) return Promise.resolve({ notes: [] });
      return Promise.resolve({ application: mockApp });
    });
    render(<ApplicationDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
    });

    fireEvent.click(
      within(screen.getByLabelText('Section navigation')).getByRole('button', {
        name: /documents/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getByText('resume.pdf')).toBeInTheDocument();
    });
  });

  describe('document previews (JEF-70)', () => {
    const mockPdfDoc = {
      id: 'doc-1',
      applicationId: 'app-test-id',
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 102400,
      url: 'https://example.com/resume.pdf',
      documentType: 'resume',
      createdAt: '2024-01-02T00:00:00.000Z',
    };
    const mockImageDoc = {
      id: 'doc-2',
      applicationId: 'app-test-id',
      name: 'portfolio.png',
      mimeType: 'image/png',
      sizeBytes: 51200,
      url: 'https://example.com/portfolio.png',
      documentType: 'portfolio',
      createdAt: '2024-01-02T00:00:00.000Z',
    };
    const mockDocxDoc = {
      id: 'doc-3',
      applicationId: 'app-test-id',
      name: 'cover-letter.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 20480,
      url: 'https://example.com/cover-letter.docx',
      documentType: 'cover_letter',
      createdAt: '2024-01-02T00:00:00.000Z',
    };

    it('opens an inline PDF preview when clicking a PDF document name', async () => {
      mockGqlRequest.mockImplementation((query: string) => {
        if (query.includes('Documents')) return Promise.resolve({ documents: [mockPdfDoc] });
        if (query.includes('Notes')) return Promise.resolve({ notes: [] });
        return Promise.resolve({ application: mockApp });
      });
      render(<ApplicationDetailPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(
        within(screen.getByLabelText('Section navigation')).getByRole('button', {
          name: /documents/i,
        }),
      );
      await waitFor(() => expect(screen.getByText('resume.pdf')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'resume.pdf' }));

      const iframe = await screen.findByTitle('resume.pdf');
      expect(iframe).toHaveAttribute('src', mockPdfDoc.url);
    });

    it('opens an inline image preview when clicking an image document name', async () => {
      mockGqlRequest.mockImplementation((query: string) => {
        if (query.includes('Documents')) return Promise.resolve({ documents: [mockImageDoc] });
        if (query.includes('Notes')) return Promise.resolve({ notes: [] });
        return Promise.resolve({ application: mockApp });
      });
      render(<ApplicationDetailPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(
        within(screen.getByLabelText('Section navigation')).getByRole('button', {
          name: /documents/i,
        }),
      );
      await waitFor(() => expect(screen.getByText('portfolio.png')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'portfolio.png' }));

      const img = await screen.findByAltText('portfolio.png');
      expect(img).toHaveAttribute('src', mockImageDoc.url);
    });

    it('closes the preview modal when the close button is clicked', async () => {
      mockGqlRequest.mockImplementation((query: string) => {
        if (query.includes('Documents')) return Promise.resolve({ documents: [mockPdfDoc] });
        if (query.includes('Notes')) return Promise.resolve({ notes: [] });
        return Promise.resolve({ application: mockApp });
      });
      render(<ApplicationDetailPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());
      fireEvent.click(
        within(screen.getByLabelText('Section navigation')).getByRole('button', {
          name: /documents/i,
        }),
      );
      await waitFor(() => expect(screen.getByText('resume.pdf')).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'resume.pdf' }));
      await screen.findByTitle('resume.pdf');

      const dialog = screen.getByTitle('resume.pdf').closest('div')!.parentElement!;
      const closeButton = within(dialog).getAllByRole('button').at(-1)!;
      fireEvent.click(closeButton);

      expect(screen.queryByTitle('resume.pdf')).not.toBeInTheDocument();
    });

    it('does not make non-previewable documents (e.g. .docx) clickable, and keeps the download link', async () => {
      mockGqlRequest.mockImplementation((query: string) => {
        if (query.includes('Documents')) return Promise.resolve({ documents: [mockDocxDoc] });
        if (query.includes('Notes')) return Promise.resolve({ notes: [] });
        return Promise.resolve({ application: mockApp });
      });
      render(<ApplicationDetailPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(
        within(screen.getByLabelText('Section navigation')).getByRole('button', {
          name: /documents/i,
        }),
      );
      await waitFor(() => expect(screen.getByText('cover-letter.docx')).toBeInTheDocument());

      expect(screen.queryByRole('button', { name: 'cover-letter.docx' })).not.toBeInTheDocument();
      const link = screen.getByRole('link', { name: 'cover-letter.docx' });
      expect(link).toHaveAttribute('href', mockDocxDoc.url);
    });
  });

  describe('resume match tab preview (JEF-70)', () => {
    const mockPdfResume = {
      id: 'doc-1',
      applicationId: 'app-test-id',
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 102400,
      url: 'https://example.com/resume.pdf',
      documentType: 'resume',
      createdAt: '2024-01-02T00:00:00.000Z',
    };
    const mockDocxResume = {
      ...mockPdfResume,
      name: 'resume.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      url: 'https://example.com/resume.docx',
    };

    it('shows a Preview button for an uploaded PDF resume and opens the modal', async () => {
      mockGqlRequest.mockImplementation((query: string) => {
        if (query.includes('Documents')) return Promise.resolve({ documents: [mockPdfResume] });
        if (query.includes('Notes')) return Promise.resolve({ notes: [] });
        return Promise.resolve({ application: mockApp });
      });
      render(<ApplicationDetailPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(
        within(screen.getByLabelText('Section navigation')).getByRole('button', {
          name: /resume match/i,
        }),
      );
      await waitFor(() => {
        expect(screen.getByText(/using your uploaded resume/i)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /^preview$/i }));

      const iframe = await screen.findByTitle('resume.pdf');
      expect(iframe).toHaveAttribute('src', mockPdfResume.url);
    });

    it('does not show a Preview button for a non-previewable resume type', async () => {
      mockGqlRequest.mockImplementation((query: string) => {
        if (query.includes('Documents')) return Promise.resolve({ documents: [mockDocxResume] });
        if (query.includes('Notes')) return Promise.resolve({ notes: [] });
        return Promise.resolve({ application: mockApp });
      });
      render(<ApplicationDetailPage />, { wrapper: Wrapper });
      await waitFor(() => expect(screen.getByText('Stripe')).toBeInTheDocument());

      fireEvent.click(
        within(screen.getByLabelText('Section navigation')).getByRole('button', {
          name: /resume match/i,
        }),
      );
      await waitFor(() => {
        expect(screen.getByText(/using your uploaded resume/i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /^preview$/i })).not.toBeInTheDocument();
    });
  });

  it('enters edit mode for a note', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Notes')) return Promise.resolve({ notes: mockNotes });
      return Promise.resolve({ application: mockApp });
    });
    render(<ApplicationDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Great first interview')).toBeInTheDocument();
    });

    // Click the edit button (first icon button inside the note card)
    const noteText = screen.getByText('Great first interview');
    const noteCard = noteText.closest('div[class*="bg-white"]') as HTMLElement;
    const noteButtons = within(noteCard).getAllByRole('button');
    fireEvent.click(noteButtons[0]); // edit button

    // Editing textarea appears with existing content
    await waitFor(() => {
      const editTextarea = screen.getByDisplayValue('Great first interview');
      expect(editTextarea.tagName).toBe('TEXTAREA');
    });
  });

  it('saves an edited note', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('UpdateNote'))
        return Promise.resolve({
          updateNote: { ...mockNotes[0], content: 'Updated note' },
        });
      if (query.includes('Notes')) return Promise.resolve({ notes: mockNotes });
      return Promise.resolve({ application: mockApp });
    });
    render(<ApplicationDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Great first interview')).toBeInTheDocument();
    });

    // Enter edit mode
    const noteCard = screen
      .getByText('Great first interview')
      .closest('div[class*="bg-white"]') as HTMLElement;
    fireEvent.click(within(noteCard).getAllByRole('button')[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Great first interview')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('Great first interview'), {
      target: { value: 'Updated note' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('UpdateNote'),
        expect.objectContaining({ id: 'note-1', content: 'Updated note' }),
      );
    });
  });

  it('deletes a note', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('DeleteNote')) return Promise.resolve({ deleteNote: true });
      if (query.includes('Notes')) return Promise.resolve({ notes: mockNotes });
      return Promise.resolve({ application: mockApp });
    });
    render(<ApplicationDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Great first interview')).toBeInTheDocument();
    });

    const noteCard = screen
      .getByText('Great first interview')
      .closest('div[class*="bg-white"]') as HTMLElement;
    const noteButtons = within(noteCard).getAllByRole('button');
    fireEvent.click(noteButtons[1]); // delete button

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('DeleteNote'),
        expect.objectContaining({ id: 'note-1' }),
      );
    });
  });

  it('deletes the application after undo window expires', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('DeleteApplication')) return Promise.resolve({ deleteApplication: true });
      if (query.includes('Notes')) return Promise.resolve({ notes: [] });
      return Promise.resolve({ application: mockApp });
    });
    render(<ApplicationDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Stripe')).toBeInTheDocument();
    });

    const deleteAppBtn = screen.getByTitle('Delete application');
    fireEvent.click(deleteAppBtn);

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('DeleteApplication'),
        expect.objectContaining({ id: 'app-test-id' }),
      );
    });
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/applications' });
  });
});
