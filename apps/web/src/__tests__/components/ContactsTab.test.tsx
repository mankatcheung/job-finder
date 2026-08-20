import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
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

import { ContactsTab } from '#/routes/_authenticated/applications/$applicationId/-components/ContactsTab';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

const mockContact = {
  id: 'contact-1',
  applicationId: 'app-1',
  name: 'Jane Recruiter',
  role: 'Technical Recruiter',
  email: 'jane@example.com',
  phone: '555-1234',
  linkedinUrl: 'https://linkedin.com/in/jane',
  notes: 'Met at a conference',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('ContactsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an empty state when there are no contacts', async () => {
    mockGqlRequest.mockResolvedValue({ contacts: [] });
    render(<ContactsTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('No contacts yet.')).toBeInTheDocument();
    });
  });

  it('renders an existing contact', async () => {
    mockGqlRequest.mockResolvedValue({ contacts: [mockContact] });
    render(<ContactsTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Jane Recruiter')).toBeInTheDocument();
    });
    expect(screen.getByText('Technical Recruiter')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('creates a new contact', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('CreateContact')) {
        return Promise.resolve({ createContact: { ...mockContact, id: 'contact-2' } });
      }
      return Promise.resolve({ contacts: [] });
    });
    render(<ContactsTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('No contacts yet.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /add contact/i }));
    fireEvent.change(screen.getByPlaceholderText('Jane Smith'), {
      target: { value: 'New Contact' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('CreateContact'),
        expect.objectContaining({ applicationId: 'app-1', name: 'New Contact' }),
      );
    });
  });

  it('edits an existing contact', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('UpdateContact')) {
        return Promise.resolve({ updateContact: { ...mockContact, name: 'Updated Name' } });
      }
      return Promise.resolve({ contacts: [mockContact] });
    });
    render(<ContactsTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Jane Recruiter')).toBeInTheDocument();
    });

    const card = screen
      .getByText('Jane Recruiter')
      .closest('div[class*="bg-white"]') as HTMLElement;
    fireEvent.click(within(card).getAllByRole('button')[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane Recruiter')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByDisplayValue('Jane Recruiter'), {
      target: { value: 'Updated Name' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('UpdateContact'),
        expect.objectContaining({ id: 'contact-1', name: 'Updated Name' }),
      );
    });
  });

  it('deletes a contact', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('DeleteContact')) return Promise.resolve({ deleteContact: true });
      return Promise.resolve({ contacts: [mockContact] });
    });
    render(<ContactsTab applicationId="app-1" />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Jane Recruiter')).toBeInTheDocument();
    });

    const card = screen
      .getByText('Jane Recruiter')
      .closest('div[class*="bg-white"]') as HTMLElement;
    fireEvent.click(within(card).getAllByRole('button')[1]);

    await waitFor(() => {
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('DeleteContact'),
        expect.objectContaining({ id: 'contact-1' }),
      );
    });
  });
});
