import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import { LINKED_OAUTH_ACCOUNTS_QUERY, UNLINK_OAUTH_ACCOUNT_MUTATION } from '../graphql/operations';
import type { LinkedOAuthAccount, OAuthProvider } from '../types';

export const linkedOAuthAccountsQueryKey = ['linkedOAuthAccounts'] as const;

export function useLinkedOAuthAccounts() {
  return useQuery({
    queryKey: linkedOAuthAccountsQueryKey,
    queryFn: () =>
      gqlRequest<{ linkedOAuthAccounts: LinkedOAuthAccount[] }>(LINKED_OAUTH_ACCOUNTS_QUERY).then(
        (data) => data.linkedOAuthAccounts,
      ),
  });
}

export function useUnlinkOAuthAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: OAuthProvider) =>
      gqlRequest<{ unlinkOAuthAccount: boolean }>(UNLINK_OAUTH_ACCOUNT_MUTATION, { provider }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: linkedOAuthAccountsQueryKey }),
  });
}
