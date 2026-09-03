import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import {
  CREATE_NOTE_MUTATION,
  DELETE_NOTE_MUTATION,
  UPDATE_NOTE_MUTATION,
} from '../graphql/operations';
import { notesQueryKey } from './useNoteQueries';
import type { Note } from '../types';

export function useCreateNote(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      gqlRequest<{ createNote: Note }>(CREATE_NOTE_MUTATION, { applicationId, content }).then(
        (data) => data.createNote,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesQueryKey(applicationId) }),
  });
}

export function useUpdateNote(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      gqlRequest<{ updateNote: Note }>(UPDATE_NOTE_MUTATION, { id, content }).then(
        (data) => data.updateNote,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesQueryKey(applicationId) }),
  });
}

export function useDeleteNote(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gqlRequest<{ deleteNote: boolean }>(DELETE_NOTE_MUTATION, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesQueryKey(applicationId) }),
  });
}
