import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import { CHAT_HISTORY_QUERY } from '../graphql/operations';
import type { ChatMessage } from '../types';

export const chatHistoryQueryKey = (conversationId: string) =>
  ['chatHistory', conversationId] as const;

export function useChatHistory(conversationId: string | null) {
  return useQuery({
    queryKey: chatHistoryQueryKey(conversationId ?? ''),
    queryFn: () =>
      gqlRequest<{ chatHistory: ChatMessage[] }>(CHAT_HISTORY_QUERY, {
        conversationId,
      }).then((data) => data.chatHistory),
    enabled: Boolean(conversationId),
  });
}

/** Appends a locally-generated message (e.g. the user's own send) to the cached history before the round-trip completes, so it shows immediately. */
export function useAppendOptimisticMessage() {
  const queryClient = useQueryClient();
  return (conversationId: string, message: ChatMessage) => {
    queryClient.setQueryData<ChatMessage[]>(chatHistoryQueryKey(conversationId), (prev) => [
      ...(prev ?? []),
      message,
    ]);
  };
}
