import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { showUndoToast } from '#/lib/undoToast';
import { toast } from 'sonner';

// ── GraphQL queries & mutations ────────────────────────────────────────────

export const CONVERSATIONS_QUERY = `
  query Conversations {
    conversations {
      id
      title
      llmProvider
      llmModel
      createdAt
      updatedAt
    }
  }
`;

export const CHAT_HISTORY_QUERY = `
  query ChatHistory($conversationId: ID!) {
    chatHistory(conversationId: $conversationId) {
      role
      content
    }
  }
`;

export const CREATE_CONVERSATION = `
  mutation CreateConversation($provider: String, $model: String) {
    createConversation(provider: $provider, model: $model) {
      id
      title
      llmProvider
      llmModel
      createdAt
      updatedAt
    }
  }
`;

export const SEND_CHAT_MESSAGE = `
  mutation SendChatMessage($conversationId: ID!, $message: String!) {
    sendChatMessage(conversationId: $conversationId, message: $message)
  }
`;

export const DELETE_CONVERSATION = `
  mutation DeleteConversation($id: ID!) {
    deleteConversation(id: $id)
  }
`;

// ── Types ───────────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatHistoryResult {
  chatHistory: ChatMessage[];
}

export interface Conversation {
  id: string;
  title: string | null;
  llmProvider: string | null;
  llmModel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsResult {
  conversations: Conversation[];
}

// ── Query options ───────────────────────────────────────────────────────────

export const conversationsQueryOptions = queryOptions({
  queryKey: ['conversations'],
  queryFn: () => gqlClient.request<ConversationsResult>(CONVERSATIONS_QUERY),
});

export function chatHistoryQueryOptions(conversationId: string) {
  return queryOptions({
    queryKey: ['chatHistory', conversationId],
    queryFn: () => gqlClient.request<ChatHistoryResult>(CHAT_HISTORY_QUERY, { conversationId }),
  });
}

// ── Shared delete-with-undo handler ─────────────────────────────────────────

/**
 * Optimistically removes a conversation from the cached list and shows an
 * undo toast; the actual deletion (and dropping its chat-history cache
 * entry) only fires once the toast's undo window expires. Shared between
 * the chat page and the history page so both stay in sync.
 */
export function deleteConversationWithUndo(
  qc: QueryClient,
  id: string,
  onDeleted?: () => void,
): void {
  const snapshot = qc.getQueryData<ConversationsResult>(conversationsQueryOptions.queryKey);
  qc.setQueryData<ConversationsResult>(conversationsQueryOptions.queryKey, (prev) => ({
    conversations: (prev?.conversations ?? []).filter((c) => c.id !== id),
  }));
  onDeleted?.();
  showUndoToast({
    message: 'Conversation deleted',
    onExecute: () => {
      gqlClient
        .request(DELETE_CONVERSATION, { id })
        .then(() => {
          qc.removeQueries({ queryKey: chatHistoryQueryOptions(id).queryKey });
        })
        .catch(() => {
          toast.error('Failed to delete conversation');
          qc.invalidateQueries({ queryKey: conversationsQueryOptions.queryKey });
        });
    },
    onUndo: () => {
      qc.setQueryData<ConversationsResult>(conversationsQueryOptions.queryKey, snapshot);
      toast.dismiss();
    },
  });
}

export function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
