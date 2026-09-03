import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import {
  CONVERSATIONS_QUERY,
  CREATE_CONVERSATION_MUTATION,
  DELETE_CONVERSATION_MUTATION,
} from '../graphql/operations';
import type { Conversation } from '../types';

export const conversationsQueryKey = ['conversations'] as const;

export function useConversations() {
  return useQuery({
    queryKey: conversationsQueryKey,
    queryFn: () =>
      gqlRequest<{ conversations: Conversation[] }>(CONVERSATIONS_QUERY).then(
        (data) => data.conversations,
      ),
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { provider?: string | null; model?: string | null }) =>
      gqlRequest<{ createConversation: Conversation }>(CREATE_CONVERSATION_MUTATION, vars).then(
        (data) => data.createConversation,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationsQueryKey }),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      gqlRequest<{ deleteConversation: boolean }>(DELETE_CONVERSATION_MUTATION, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationsQueryKey }),
  });
}
