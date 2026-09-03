import { useMutation } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import { DELETE_ACCOUNT_MUTATION } from '../graphql/operations';

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (password: string) =>
      gqlRequest<{ deleteAccount: boolean }>(DELETE_ACCOUNT_MUTATION, { password }),
  });
}
