import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import { NOTES_QUERY } from '../graphql/operations';
import type { Note } from '../types';

export const notesQueryKey = (applicationId: string) => ['notes', applicationId] as const;

export function useNotes(applicationId: string) {
  return useQuery({
    queryKey: notesQueryKey(applicationId),
    queryFn: () =>
      gqlRequest<{ notes: Note[] }>(NOTES_QUERY, { applicationId }).then((data) => data.notes),
    enabled: Boolean(applicationId),
  });
}
