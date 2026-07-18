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

    expect(screen.getByRole('button', { name: /notes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /documents/i })).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole('button', { name: 'documents' }));

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

    fireEvent.click(screen.getByRole('button', { name: 'documents' }));

    await waitFor(() => {
      expect(screen.getByText('resume.pdf')).toBeInTheDocument();
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
    const noteCard = screen.getByText('Great first interview').closest('div[class*="bg-white"]') as HTMLElement;
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

    const noteCard = screen.getByText('Great first interview').closest('div[class*="bg-white"]') as HTMLElement;
    const noteButtons = within(noteCard).getAllByRole('button');
    fireEvent.click(noteButtons[1]); // delete button

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('DeleteNote'),
        expect.objectContaining({ id: 'note-1' }),
      );
    });
  });

  it('deletes the application after confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
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
