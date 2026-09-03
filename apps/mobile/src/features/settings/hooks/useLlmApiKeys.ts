import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import {
  DELETE_LLM_API_KEY_MUTATION,
  LLM_API_KEYS_QUERY,
  SAVE_LLM_API_KEY_MUTATION,
  SET_DEFAULT_LLM_PROVIDER_MUTATION,
  TEST_LLM_API_KEY_MUTATION,
} from '../graphql/operations';
import type { LlmApiKey } from '../types';

export const llmApiKeysQueryKey = ['llmApiKeys'] as const;

interface LlmApiKeysResult {
  keys: LlmApiKey[];
  defaultProvider: string | null;
}

export function useLlmApiKeys() {
  return useQuery({
    queryKey: llmApiKeysQueryKey,
    queryFn: () =>
      gqlRequest<{ llmApiKeys: LlmApiKey[]; me: { defaultLlmProvider: string | null } }>(
        LLM_API_KEYS_QUERY,
      ).then((data): LlmApiKeysResult => ({
        keys: data.llmApiKeys,
        defaultProvider: data.me.defaultLlmProvider,
      })),
  });
}

export interface SaveLlmApiKeyInput {
  provider: string;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export function useSaveLlmApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveLlmApiKeyInput) =>
      gqlRequest<{ saveLlmApiKey: boolean }>(SAVE_LLM_API_KEY_MUTATION, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: llmApiKeysQueryKey }),
  });
}

export function useDeleteLlmApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) =>
      gqlRequest<{ deleteLlmApiKey: boolean }>(DELETE_LLM_API_KEY_MUTATION, { provider }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: llmApiKeysQueryKey }),
  });
}

export function useSetDefaultLlmProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) =>
      gqlRequest<{ setDefaultLlmProvider: boolean }>(SET_DEFAULT_LLM_PROVIDER_MUTATION, {
        provider,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: llmApiKeysQueryKey }),
  });
}

export interface TestLlmApiKeyInput {
  provider: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export function useTestLlmApiKey() {
  return useMutation({
    mutationFn: (input: TestLlmApiKeyInput) =>
      gqlRequest<{ testLlmApiKey: { ok: boolean; error: string | null } }>(
        TEST_LLM_API_KEY_MUTATION,
        input,
      ).then((data) => data.testLlmApiKey),
  });
}
