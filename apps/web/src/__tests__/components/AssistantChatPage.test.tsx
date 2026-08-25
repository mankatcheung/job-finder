import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest, mockNavigate, mockSearch } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
  mockNavigate: vi.fn(),
  mockSearch: vi.fn(() => ({}) as { conversation?: string }),
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (opts: Record<string, unknown>) => ({
    ...opts,
    useSearch: mockSearch,
    fullPath: '/assistant/',
  }),
  useNavigate: () => mockNavigate,
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
    <a href={to} onClick={() => mockNavigate({ search })} {...rest}>
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

import { AssistantPage } from '#/routes/_authenticated/assistant/-components/AssistantPage';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

const noConversations = () => Promise.resolve({ conversations: [] });

describe('AssistantPage (chat)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockReturnValue({});
  });

  it('shows suggested questions when there is no active conversation', async () => {
    mockGqlRequest.mockImplementation(noConversations);
    render(<AssistantPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(
        screen.getByText('Ask about your applications, contacts, or interview rounds.'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('Summarize my interviews this month')).toBeInTheDocument();
  });

  it('does not render an embedded conversation list — recent chats live in the app sidebar', () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Conversations'))
        return Promise.resolve({
          conversations: [{ id: 'conv-1', title: 'Which applications have I applied to?' }],
        });
      return Promise.resolve({ chatHistory: [] });
    });
    render(<AssistantPage />, { wrapper: Wrapper });

    // JEF-229: conversation switching moved to subitems under Assistant in
    // the app sidebar (AuthenticatedLayout), so the chat page itself stays a
    // single focused column.
    expect(screen.queryByText('Which applications have I applied to?')).not.toBeInTheDocument();
  });

  it('links to the conversation history page', async () => {
    mockGqlRequest.mockImplementation(noConversations);
    render(<AssistantPage />, { wrapper: Wrapper });

    // The mobile-only header icon keeps this accessible name; the sidebar
    // contributes a navigation landmark and an "All chats" link instead.
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Conversation history' })).toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: 'Conversation history' })).toHaveAttribute(
      'href',
      '/assistant/history',
    );
  });

  it('only shows the delete-conversation button when a conversation is active', async () => {
    mockSearch.mockReturnValue({ conversation: 'conv-1' });
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Conversations')) return noConversations();
      if (query.includes('ChatHistory')) return Promise.resolve({ chatHistory: [] });
      return Promise.resolve({});
    });
    render(<AssistantPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByLabelText('Delete conversation')).toBeInTheDocument());
  });

  it('does not show the delete-conversation button with no active conversation', async () => {
    mockGqlRequest.mockImplementation(noConversations);
    render(<AssistantPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(
        screen.getByText('Ask about your applications, contacts, or interview rounds.'),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByLabelText('Delete conversation')).not.toBeInTheDocument();
  });

  it('renders the active conversation’s history from the loader-populated query', async () => {
    mockSearch.mockReturnValue({ conversation: 'conv-1' });
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Conversations')) return noConversations();
      if (query.includes('ChatHistory'))
        return Promise.resolve({
          chatHistory: [
            {
              id: 'm1',
              role: 'user',
              content: 'earlier question',
              createdAt: '2024-01-01T00:00:00.000Z',
            },
            {
              id: 'm2',
              role: 'assistant',
              content: 'earlier answer',
              createdAt: '2024-01-01T00:00:01.000Z',
            },
          ],
        });
      return Promise.resolve({});
    });

    render(<AssistantPage />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('earlier question')).toBeInTheDocument());
    expect(screen.getByText('earlier answer')).toBeInTheDocument();
    expect(
      screen.queryByText('Ask about your applications, contacts, or interview rounds.'),
    ).not.toBeInTheDocument();
  });

  it('sends a message into the active conversation and appends the reply', async () => {
    mockSearch.mockReturnValue({ conversation: 'conv-1' });
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Conversations')) return noConversations();
      if (query.includes('ChatHistory')) return Promise.resolve({ chatHistory: [] });
      if (query.includes('SendChatMessage'))
        return Promise.resolve({ sendChatMessage: 'You have 2 active applications.' });
      return Promise.resolve({});
    });

    render(<AssistantPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(
        screen.getByText('Ask about your applications, contacts, or interview rounds.'),
      ).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByPlaceholderText('Ask a question…'), {
      target: { value: 'how many active applications do I have?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(screen.getByText('You have 2 active applications.')).toBeInTheDocument(),
    );
    expect(screen.getByText('how many active applications do I have?')).toBeInTheDocument();
    expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('SendChatMessage'), {
      conversationId: 'conv-1',
      message: 'how many active applications do I have?',
    });
  });

  it('creates a conversation implicitly when sending with no active conversation', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Conversations')) return noConversations();
      if (query.includes('CreateConversation'))
        return Promise.resolve({
          createConversation: { id: 'new-conv', title: null, createdAt: '', updatedAt: '' },
        });
      if (query.includes('SendChatMessage'))
        return Promise.resolve({ sendChatMessage: 'Sure, here is a summary.' });
      return Promise.resolve({});
    });

    render(<AssistantPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(
        screen.getByText('Ask about your applications, contacts, or interview rounds.'),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText('Summarize my interviews this month'));

    await waitFor(() =>
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('SendChatMessage'),
        expect.objectContaining({ conversationId: 'new-conv' }),
      ),
    );
    expect(mockNavigate).toHaveBeenCalledWith({ search: { conversation: 'new-conv' } });
  });

  it('deletes the active conversation and navigates back to a blank chat', async () => {
    mockSearch.mockReturnValue({ conversation: 'conv-1' });
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('Conversations'))
        return Promise.resolve({ conversations: [{ id: 'conv-1', title: 'Old chat' }] });
      if (query.includes('DeleteConversation'))
        return Promise.resolve({ deleteConversation: true });
      return Promise.resolve({ chatHistory: [] });
    });

    render(<AssistantPage />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByLabelText('Delete conversation')).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Delete conversation'));

    await waitFor(() =>
      expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('DeleteConversation'), {
        id: 'conv-1',
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith({ search: {} });
  });
});
