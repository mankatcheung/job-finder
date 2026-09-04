import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import {
  API_TOKENS_QUERY,
  CREATE_API_TOKEN_MUTATION,
  CREATE_SHARE_LINK_MUTATION,
  DELETE_API_TOKEN_MUTATION,
  DELETE_SHARE_LINK_MUTATION,
  MCP_OAUTH_GRANTS_QUERY,
  REVOKE_MCP_OAUTH_GRANT_MUTATION,
  SHARE_LINKS_QUERY,
} from '../graphql/operations';
import type {
  ApiToken,
  ApiTokenScope,
  CreateApiTokenPayload,
  CreateShareLinkPayload,
  McpOAuthGrant,
  ShareLink,
} from '../types';

export const apiTokensQueryKey = ['apiTokens'] as const;
export const mcpOAuthGrantsQueryKey = ['mcpOAuthGrants'] as const;
export const shareLinksQueryKey = ['shareLinks'] as const;

export function useApiTokens() {
  return useQuery({
    queryKey: apiTokensQueryKey,
    queryFn: () => gqlRequest<{ apiTokens: ApiToken[] }>(API_TOKENS_QUERY).then((d) => d.apiTokens),
  });
}

export function useCreateApiToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; scope: ApiTokenScope }) =>
      gqlRequest<{ createApiToken: CreateApiTokenPayload }>(CREATE_API_TOKEN_MUTATION, input).then(
        (d) => d.createApiToken,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiTokensQueryKey }),
  });
}

export function useDeleteApiToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gqlRequest(DELETE_API_TOKEN_MUTATION, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiTokensQueryKey }),
  });
}

export function useMcpOAuthGrants() {
  return useQuery({
    queryKey: mcpOAuthGrantsQueryKey,
    queryFn: () =>
      gqlRequest<{ mcpOAuthGrants: McpOAuthGrant[] }>(MCP_OAUTH_GRANTS_QUERY).then(
        (d) => d.mcpOAuthGrants,
      ),
  });
}

export function useRevokeMcpOAuthGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gqlRequest(REVOKE_MCP_OAUTH_GRANT_MUTATION, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: mcpOAuthGrantsQueryKey }),
  });
}

export function useShareLinks() {
  return useQuery({
    queryKey: shareLinksQueryKey,
    queryFn: () =>
      gqlRequest<{ shareLinks: ShareLink[] }>(SHARE_LINKS_QUERY).then((d) => d.shareLinks),
  });
}

export function useCreateShareLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      gqlRequest<{ createShareLink: CreateShareLinkPayload }>(CREATE_SHARE_LINK_MUTATION, {
        name,
      }).then((d) => d.createShareLink),
    onSuccess: () => qc.invalidateQueries({ queryKey: shareLinksQueryKey }),
  });
}

export function useDeleteShareLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gqlRequest(DELETE_SHARE_LINK_MUTATION, { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: shareLinksQueryKey }),
  });
}
