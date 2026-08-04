import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JdImportPanel } from '#/routes/_authenticated/applications/-components/JdImportPanel';

const { mockGqlRequest } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('JdImportPanel', () => {
  const onFill = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the collapsed toggle button', () => {
    render(<JdImportPanel onFill={onFill} />);
    expect(screen.getByText('Auto-fill from job posting')).toBeInTheDocument();
  });

  it('expands the panel when toggle is clicked', () => {
    render(<JdImportPanel onFill={onFill} />);
    fireEvent.click(screen.getByText('Auto-fill from job posting'));
    expect(screen.getByText('Paste text')).toBeInTheDocument();
    expect(screen.getByText('From URL')).toBeInTheDocument();
  });

  it('shows the textarea in text mode by default', () => {
    render(<JdImportPanel onFill={onFill} />);
    fireEvent.click(screen.getByText('Auto-fill from job posting'));
    expect(screen.getByPlaceholderText(/paste the job description/i)).toBeInTheDocument();
  });

  it('switches to URL mode when "From URL" is clicked', () => {
    render(<JdImportPanel onFill={onFill} />);
    fireEvent.click(screen.getByText('Auto-fill from job posting'));
    fireEvent.click(screen.getByText('From URL'));
    expect(screen.getByPlaceholderText(/https:\/\/company\.com/i)).toBeInTheDocument();
  });

  it('disables the auto-fill button when input is empty', () => {
    render(<JdImportPanel onFill={onFill} />);
    fireEvent.click(screen.getByText('Auto-fill from job posting'));
    const btn = screen.getByRole('button', { name: /auto-fill fields/i });
    expect(btn).toBeDisabled();
  });

  it('enables the auto-fill button when text is entered', () => {
    render(<JdImportPanel onFill={onFill} />);
    fireEvent.click(screen.getByText('Auto-fill from job posting'));
    fireEvent.change(screen.getByPlaceholderText(/paste the job description/i), {
      target: { value: 'Software Engineer at Acme' },
    });
    const btn = screen.getByRole('button', { name: /auto-fill fields/i });
    expect(btn).toBeEnabled();
  });

  it('calls onFill with parsed data on successful auto-fill', async () => {
    mockGqlRequest.mockResolvedValue({
      parseJobDescription: {
        company: 'Acme',
        role: 'Engineer',
        location: 'Remote',
        salary: '$100k',
        description: 'Build things',
      },
    });

    render(<JdImportPanel onFill={onFill} />);
    fireEvent.click(screen.getByText('Auto-fill from job posting'));
    fireEvent.change(screen.getByPlaceholderText(/paste the job description/i), {
      target: { value: 'Software Engineer at Acme' },
    });
    fireEvent.click(screen.getByRole('button', { name: /auto-fill fields/i }));

    await waitFor(() => {
      expect(onFill).toHaveBeenCalledWith({
        company: 'Acme',
        role: 'Engineer',
        location: 'Remote',
        salary: '$100k',
        description: 'Build things',
      });
    });
  });

  it('shows error message on mutation failure', async () => {
    mockGqlRequest.mockRejectedValue(new Error('Network error'));

    render(<JdImportPanel onFill={onFill} />);
    fireEvent.click(screen.getByText('Auto-fill from job posting'));
    fireEvent.change(screen.getByPlaceholderText(/paste the job description/i), {
      target: { value: 'Some job description' },
    });
    fireEvent.click(screen.getByRole('button', { name: /auto-fill fields/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows "Parsing..." while loading', async () => {
    let resolvePromise: (value: unknown) => void;
    mockGqlRequest.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    render(<JdImportPanel onFill={onFill} />);
    fireEvent.click(screen.getByText('Auto-fill from job posting'));
    fireEvent.change(screen.getByPlaceholderText(/paste the job description/i), {
      target: { value: 'Job description' },
    });
    fireEvent.click(screen.getByRole('button', { name: /auto-fill fields/i }));

    await waitFor(() => {
      expect(screen.getByText('Parsing…')).toBeInTheDocument();
    });

    resolvePromise!({
      parseJobDescription: {
        company: null,
        role: null,
        location: null,
        salary: null,
        description: null,
      },
    });
  });

  it('shows "Filled!" after successful auto-fill', async () => {
    mockGqlRequest.mockResolvedValue({
      parseJobDescription: {
        company: null,
        role: null,
        location: null,
        salary: null,
        description: null,
      },
    });

    render(<JdImportPanel onFill={onFill} />);
    fireEvent.click(screen.getByText('Auto-fill from job posting'));
    fireEvent.change(screen.getByPlaceholderText(/paste the job description/i), {
      target: { value: 'Job description' },
    });
    fireEvent.click(screen.getByRole('button', { name: /auto-fill fields/i }));

    await waitFor(() => {
      expect(screen.getByText('Filled!')).toBeInTheDocument();
    });
  });

  it('shows AI not configured message when error code matches', async () => {
    mockGqlRequest.mockRejectedValue({
      response: { errors: [{ extensions: { code: 'AI_NOT_CONFIGURED' } }] },
    });

    render(<JdImportPanel onFill={onFill} />);
    fireEvent.click(screen.getByText('Auto-fill from job posting'));
    fireEvent.change(screen.getByPlaceholderText(/paste the job description/i), {
      target: { value: 'Job description' },
    });
    fireEvent.click(screen.getByRole('button', { name: /auto-fill fields/i }));

    await waitFor(() => {
      expect(screen.getByText(/add your ai api key/i)).toBeInTheDocument();
    });
  });
});
