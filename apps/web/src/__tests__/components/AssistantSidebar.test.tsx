import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { mockGqlRequest, mockNavigate } = vi.hoisted(() => ({
  mockGqlRequest: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  // AssistantSidebar pulls useNavigate directly (for new chat), so both
  // exports come from this mock.
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
    <a href={to} onClick={() => mockNavigate({ to, search })} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('#/graphql/client', () => ({
  gqlClient: { request: mockGqlRequest },
}));

import { AssistantSidebar } from '#/routes/_authenticated/assistant/-components/AssistantSidebar';
import { SIDEBAR_CONVERSATION_LIMIT } from '#/routes/_authenticated/assistant/-shared';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

const recentConversations = (ids: string[]) => ({
  conversations: ids.map((id, i) => ({
    id,
    title: `${id} title`,
    llmProvider: null,
    llmModel: null,
    createdAt: new Date(Date.now() - i * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - i * 60_000).toISOString(),
  })),
});

describe('AssistantSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGqlRequest.mockResolvedValue(recentConversations(['conv-1', 'conv-2']));
  });

  it('fetches only the bounded recent window, not the full history', async () => {
    render(<AssistantSidebar activeId={undefined} onNewConversation={() => {}} />, {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(screen.getByText('conv-2 title')).toBeInTheDocument());
    expect(mockGqlRequest).toHaveBeenCalledWith(expect.stringContaining('RecentConversations'), {
      limit: SIDEBAR_CONVERSATION_LIMIT,
    });
    expect(mockGqlRequest).not.toHaveBeenCalledWith('query Conversations');
  });

  it('marks the active conversation and links each row to its thread', async () => {
    render(<AssistantSidebar activeId="conv-1" onNewConversation={() => {}} />, {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(screen.getByText('conv-1 title')).toBeInTheDocument());
    const activeRow = screen.getByText('conv-1 title').closest('a');
    expect(activeRow).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('conv-2 title').closest('a')).not.toHaveAttribute('aria-current');

    fireEvent.click(screen.getByText('conv-2 title'));
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/assistant',
      search: { conversation: 'conv-2' },
    });
  });

  it('starts a new chat from the top button', async () => {
    const onNewConversation = vi.fn();
    render(<AssistantSidebar activeId="conv-1" onNewConversation={onNewConversation} />, {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(screen.getByText('conv-1 title')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));

    expect(onNewConversation).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('links to the all-chats page at the bottom', async () => {
    render(<AssistantSidebar activeId={undefined} onNewConversation={() => {}} />, {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(screen.getByText('All chats')).toBeInTheDocument());
    expect(screen.getByText('All chats').closest('a')).toHaveAttribute(
      'href',
      '/assistant/history',
    );
  });
});
