import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest, mockStreamChatMessage } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
  mockStreamChatMessage: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

vi.mock('#/lib/chatStream', async () => {
  const actual = await vi.importActual<typeof import('#/lib/chatStream')>('#/lib/chatStream');
  return { ...actual, streamChatMessage: mockStreamChatMessage };
});

import { ChatConversationView } from '#/routes/_authenticated/assistant/-components/ChatConversationView';
import { ChatStreamError } from '#/lib/chatStream';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

describe('ChatConversationView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the empty state and no suggested questions when none are given', async () => {
    render(
      <ChatConversationView
        conversationId={null}
        provider={null}
        model=""
        onConversationCreated={vi.fn()}
      />,
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(
        screen.getByText('Ask about your applications, contacts, or interview rounds.'),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByRole('button', { name: /summarize/i })).not.toBeInTheDocument();
  });

  it('streams the reply chip-by-chip and lazily creates a conversation on click', async () => {
    // conversationId is a controlled prop — a real caller (AssistantPage's
    // routing, or the dock's own state) re-renders with the new id once
    // onConversationCreated fires, which is what makes the reply visible.
    // This test asserts what the component itself is responsible for: the
    // create + stream calls firing with the right arguments, the streamed
    // text rendering live, and the callback firing with the new id.
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('CreateConversation'))
        return Promise.resolve({
          createConversation: { id: 'new-conv', title: null, createdAt: '', updatedAt: '' },
        });
      if (query.includes('ChatHistory'))
        return Promise.resolve({
          chatHistory: [
            { id: 'm1', role: 'user', content: 'What are my active applications?', createdAt: '' },
            { id: 'm2', role: 'assistant', content: 'Here you go.', createdAt: '' },
          ],
        });
      return Promise.resolve({});
    });
    let capturedOnDelta: ((text: string) => void) | undefined;
    mockStreamChatMessage.mockImplementation(({ onDelta }: { onDelta: (text: string) => void }) => {
      capturedOnDelta = onDelta;
      return new Promise<void>(() => {});
    });
    const onConversationCreated = vi.fn();

    render(
      <ChatConversationView
        conversationId={null}
        provider="anthropic"
        model=""
        onConversationCreated={onConversationCreated}
        suggestedQuestions={['What are my active applications?']}
      />,
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(screen.getByText('What are my active applications?')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText('What are my active applications?'));

    await waitFor(() =>
      expect(mockStreamChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'new-conv',
          message: 'What are my active applications?',
        }),
      ),
    );
    expect(onConversationCreated).toHaveBeenCalledWith('new-conv');

    capturedOnDelta?.('Here');
    capturedOnDelta?.(' you go.');
    await waitFor(() => expect(screen.getByText('Here you go.')).toBeInTheDocument());
  });

  it('renders existing chat history for an active conversation', async () => {
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('ChatHistory'))
        return Promise.resolve({
          chatHistory: [
            { id: 'm1', role: 'user', content: 'hi', createdAt: '2024-01-01T00:00:00.000Z' },
            {
              id: 'm2',
              role: 'assistant',
              content: 'hello!',
              createdAt: '2024-01-01T00:00:01.000Z',
            },
          ],
        });
      return Promise.resolve({});
    });

    render(
      <ChatConversationView
        conversationId="conv-1"
        provider={null}
        model=""
        onConversationCreated={vi.fn()}
      />,
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(screen.getByText('hi')).toBeInTheDocument());
    expect(screen.getByText('hello!')).toBeInTheDocument();
  });

  it('applies compact spacing when compact is true', async () => {
    const { container } = render(
      <ChatConversationView
        conversationId={null}
        provider={null}
        model=""
        onConversationCreated={vi.fn()}
        compact
      />,
      { wrapper: Wrapper },
    );

    await waitFor(() =>
      expect(
        screen.getByText('Ask about your applications, contacts, or interview rounds.'),
      ).toBeInTheDocument(),
    );
    expect(container.querySelector('.p-3')).not.toBeNull();
  });

  it('replaces the streamed bubble with the persisted history once the stream finishes', async () => {
    let chatHistoryCallCount = 0;
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('ChatHistory')) {
        chatHistoryCallCount++;
        return Promise.resolve(
          chatHistoryCallCount === 1
            ? { chatHistory: [] }
            : {
                chatHistory: [
                  { id: 'm1', role: 'user', content: 'hi', createdAt: '' },
                  { id: 'm2', role: 'assistant', content: 'Persisted reply.', createdAt: '' },
                ],
              },
        );
      }
      return Promise.resolve({});
    });
    mockStreamChatMessage.mockImplementation(
      async ({ onDelta }: { onDelta: (text: string) => void }) => {
        onDelta('Persisted');
        onDelta(' reply.');
      },
    );

    render(
      <ChatConversationView
        conversationId="conv-1"
        provider={null}
        model=""
        onConversationCreated={vi.fn()}
      />,
      { wrapper: Wrapper },
    );

    fireEvent.change(screen.getByPlaceholderText('Ask a question…'), { target: { value: 'hi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(screen.getAllByText('Persisted reply.')).toHaveLength(1));
  });

  it('shows the AI-not-configured link for a ChatStreamError with that code', async () => {
    mockGqlRequest.mockImplementation(() => Promise.resolve({ chatHistory: [] }));
    mockStreamChatMessage.mockRejectedValue(
      new ChatStreamError('Add your AI API key', 'AI_NOT_CONFIGURED'),
    );

    render(
      <ChatConversationView
        conversationId="conv-1"
        provider={null}
        model=""
        onConversationCreated={vi.fn()}
      />,
      { wrapper: Wrapper },
    );

    fireEvent.change(screen.getByPlaceholderText('Ask a question…'), { target: { value: 'hi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(screen.getByText('Account settings')).toBeInTheDocument());
  });

  it("shows the ChatStreamError's own message for any other code", async () => {
    mockGqlRequest.mockImplementation(() => Promise.resolve({ chatHistory: [] }));
    mockStreamChatMessage.mockRejectedValue(
      new ChatStreamError('Too many messages — please wait a moment and try again', 'RATE_LIMITED'),
    );

    render(
      <ChatConversationView
        conversationId="conv-1"
        provider={null}
        model=""
        onConversationCreated={vi.fn()}
      />,
      { wrapper: Wrapper },
    );

    fireEvent.change(screen.getByPlaceholderText('Ask a question…'), { target: { value: 'hi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(
        screen.getByText('Too many messages — please wait a moment and try again'),
      ).toBeInTheDocument(),
    );
  });
});
