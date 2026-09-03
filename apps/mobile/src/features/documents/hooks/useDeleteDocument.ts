import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import { DELETE_DOCUMENT_MUTATION } from '../graphql/operations';
import { documentsQueryKey } from './useDocumentQueries';

export function useDeleteDocument(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      gqlRequest<{ deleteDocument: boolean }>(DELETE_DOCUMENT_MUTATION, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsQueryKey(applicationId) }),
  });
}
