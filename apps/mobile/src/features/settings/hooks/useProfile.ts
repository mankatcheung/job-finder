import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import { PROFILE_QUERY, UPDATE_PROFILE_MUTATION } from '../graphql/operations';
import type { Profile } from '../types';

export const profileQueryKey = ['profile'] as const;

export function useProfile() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: () => gqlRequest<{ me: Profile }>(PROFILE_QUERY).then((data) => data.me),
  });
}

export interface UpdateProfileInput {
  name?: string;
  timezone?: string;
  targetRole?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      gqlRequest<{ updateProfile: boolean }>(UPDATE_PROFILE_MUTATION, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileQueryKey }),
  });
}
