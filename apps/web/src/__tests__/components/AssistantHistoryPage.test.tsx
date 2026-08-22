import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest, mockNavigate } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => opts,
  Link: ({
    children,
    to,
    search,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    search?: Record<string, unknown>;
  }) => (
    <a href={to} onClick={() => mockNavigate({ to, search })} {...rest}>
      {children}
    </a>
  ),
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

import { ConversationHistoryPage } from '#/routes/_authenticated/assistant/-components/ConversationHistoryPage';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

describe('ConversationHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading placeholder instead of the empty state while the request is in flight', () => {
    mockGqlRequest.mockReturnValue(new Promise(() => {}));
    render(<ConversationHistoryPage />, { wrapper: Wrapper });

    expect(screen.queryByText('No conversations yet.')).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no conversations', async () => {
    mockGqlRequest.mockResolvedValue({ conversations: [] });
    render(<ConversationHistoryPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('No conversations yet.')).toBeInTheDocument());
  });

  it('lists conversations, falling back to "New conversation" for an untitled one', async () => {
    mockGqlRequest.mockResolvedValue({
      conversations: [
        {
          id: 'conv-1',
          title: 'Which applications have I applied to?',
          llmProvider: 'openai',
          llmModel: null,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'conv-2',
          title: null,
          llmProvider: null,
          llmModel: null,
          updatedAt: new Date().toISOString(),
        },
      ],
    });
    render(<ConversationHistoryPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Which applications have I applied to?')).toBeInTheDocument(),
    );
    // One "New conversation" is the header link; the other is the untitled row's fallback title.
    expect(screen.getAllByText('New conversation')).toHaveLength(2);
  });

  it('links each row to the chat page for that conversation', async () => {
    mockGqlRequest.mockResolvedValue({
      conversations: [
        {
          id: 'conv-1',
          title: 'Old chat',
          llmProvider: null,
          llmModel: null,
          updatedAt: new Date().toISOString(),
        },
      ],
    });
    render(<ConversationHistoryPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Old chat')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Old chat'));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/assistant',
      search: { conversation: 'conv-1' },
    });
  });

  it('deletes a conversation from the list', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('DeleteConversation'))
        return Promise.resolve({ deleteConversation: true });
      return Promise.resolve({
        conversations: [
          {
            id: 'conv-1',
            title: 'Old chat',
            llmProvider: null,
            llmModel: null,
            updatedAt: new Date().toISOString(),
          },
        ],
      });
    });
    render(<ConversationHistoryPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Old chat')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Delete Old chat'));

    await waitFor(() =>
      expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('DeleteConversation'), {
        id: 'conv-1',
      }),
    );
    // Regression: the delete button must be a sibling of the row's Link, not
    // nested inside it — nesting it caused the click to bubble into the
    // Link's own navigation instead of (or as well as) deleting.
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not delete when undo is clicked', async () => {
    const { showUndoToast } = await import('#/lib/undoToast');
    vi.mocked(showUndoToast).mockImplementation(() => {});

    mockGqlRequest.mockResolvedValue({
      conversations: [
        {
          id: 'conv-1',
          title: 'Old chat',
          llmProvider: null,
          llmModel: null,
          updatedAt: new Date().toISOString(),
        },
      ],
    });
    render(<ConversationHistoryPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('Old chat')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Delete Old chat'));

    await new Promise((r) => setTimeout(r, 100));
    expect(mockGqlRequest).not.toHaveBeenCalledWith(
      expect.stringContaining('DeleteConversation'),
      expect.anything(),
    );
  });
});
