import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import {
  REVOKE_OTHER_SESSIONS_MUTATION,
  REVOKE_SESSION_MUTATION,
  SESSIONS_QUERY,
  UPDATE_PASSWORD_MUTATION,
} from '../graphql/operations';
import type { Session } from '../types';

export const sessionsQueryKey = ['sessions'] as const;

export function useSessions() {
  return useQuery({
    queryKey: sessionsQueryKey,
    queryFn: () =>
      gqlRequest<{ sessions: Session[] }>(SESSIONS_QUERY).then((data) => data.sessions),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      gqlRequest<{ revokeSession: boolean }>(REVOKE_SESSION_MUTATION, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsQueryKey }),
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gqlRequest<{ revokeOtherSessions: boolean }>(REVOKE_OTHER_SESSIONS_MUTATION),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionsQueryKey }),
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      gqlRequest<{ updatePassword: boolean }>(UPDATE_PASSWORD_MUTATION, input),
  });
}
