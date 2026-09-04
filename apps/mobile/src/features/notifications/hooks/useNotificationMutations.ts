import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import { MARK_NOTIFICATIONS_READ_MUTATION } from '../graphql/operations';

export function useMarkNotificationsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, isRead }: { ids: string[]; isRead: boolean }) =>
      gqlRequest(MARK_NOTIFICATIONS_READ_MUTATION, { ids, isRead }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
