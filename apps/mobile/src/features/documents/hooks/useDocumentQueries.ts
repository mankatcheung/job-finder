import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import { DOCUMENTS_QUERY } from '../graphql/operations';
import type { Document } from '../types';

export const documentsQueryKey = (applicationId: string) => ['documents', applicationId] as const;

export function useDocuments(applicationId: string) {
  return useQuery({
    queryKey: documentsQueryKey(applicationId),
    queryFn: () =>
      gqlRequest<{ documents: Document[] }>(DOCUMENTS_QUERY, { applicationId }).then(
        (data) => data.documents,
      ),
    enabled: Boolean(applicationId),
  });
}
