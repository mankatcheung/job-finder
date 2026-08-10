import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

import { ChatConversationView } from '#/routes/_authenticated/assistant/-components/ChatConversationView';

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

  it('renders suggested question chips when provided, and lazily creates a conversation on click', async () => {
    // conversationId is a controlled prop — a real caller (AssistantPage's
    // routing, or the dock's own state) re-renders with the new id once
    // onConversationCreated fires, which is what makes the reply visible.
    // This test asserts what the component itself is responsible for: the
    // create + send calls firing with the right arguments, and the callback
    // firing with the new id — not the caller's downstream re-render.
    mockGqlRequest.mockImplementation((query: string) => {
      if (query.includes('CreateConversation'))
        return Promise.resolve({
          createConversation: { id: 'new-conv', title: null, createdAt: '', updatedAt: '' },
        });
      if (query.includes('SendChatMessage'))
        return Promise.resolve({ sendChatMessage: 'Here you go.' });
      return Promise.resolve({});
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
      expect(mockGqlRequest).toHaveBeenCalledWith(
        expect.stringContaining('SendChatMessage'),
        expect.objectContaining({
          conversationId: 'new-conv',
          message: 'What are my active applications?',
        }),
      ),
    );
    expect(onConversationCreated).toHaveBeenCalledWith('new-conv');
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
});
