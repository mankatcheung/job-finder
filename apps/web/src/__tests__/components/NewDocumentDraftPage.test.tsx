import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const { mockGqlRequest, mockNavigate } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => ({
    ...opts,
    useParams: () => ({ applicationId: 'app-1' }),
  }),
  useNavigate: () => mockNavigate,
}));

vi.mock('#/graphql/client', () => ({ gqlClient: { request: mockGqlRequest } }));

import { NewDocumentDraftPage } from '#/routes/_authenticated/applications/$applicationId/documents/new';

const selectResume = () => fireEvent.click(screen.getByRole('button', { name: /^resume$/i }));

describe('NewDocumentDraftPage — generating a resume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGqlRequest.mockResolvedValue({ documents: [] });
  });

  it('offers generation only for resumes, not cover letters', async () => {
    render(<NewDocumentDraftPage />);
    await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());

    // Cover letter is the default type; those are generated from their own tab.
    expect(screen.queryByRole('button', { name: /generate resume/i })).not.toBeInTheDocument();

    selectResume();
    expect(screen.getByRole('button', { name: /generate resume/i })).toBeInTheDocument();
  });

  it('says the resume is built only from what the user entered', async () => {
    // The honesty claim is part of the feature, not decoration: users need to
    // know the model is not inventing history for them.
    render(<NewDocumentDraftPage />);
    await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());
    selectResume();

    expect(screen.getByText(/nothing is invented/i)).toBeInTheDocument();
    expect(screen.getByText(/work experience, education and skills/i)).toBeInTheDocument();
  });

  it('generates and opens the draft in the editor', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('GenerateResume'))
        return Promise.resolve({ generateResume: { id: 'draft-9', applicationId: 'app-1' } });
      return Promise.resolve({ documents: [] });
    });
    render(<NewDocumentDraftPage />);
    await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());
    selectResume();

    fireEvent.click(screen.getByRole('button', { name: /generate resume/i }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/applications/$applicationId/documents/$draftId',
        params: { applicationId: 'app-1', draftId: 'draft-9' },
      }),
    );
  });

  it('shows why generation was refused, and stays put', async () => {
    // A refused resume — the model named an employer the user never entered —
    // must not silently look like nothing happened.
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('GenerateResume'))
        return Promise.reject({
          response: {
            errors: [
              {
                message: 'The AI produced a resume containing experience you have not recorded',
                extensions: { code: 'AI_RESPONSE_INVALID' },
              },
            ],
          },
        });
      return Promise.resolve({ documents: [] });
    });
    render(<NewDocumentDraftPage />);
    await waitFor(() => expect(mockGqlRequest).toHaveBeenCalled());
    selectResume();

    fireEvent.click(screen.getByRole('button', { name: /generate resume/i }));

    await waitFor(() => expect(screen.getByText(/have not recorded/i)).toBeInTheDocument());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
