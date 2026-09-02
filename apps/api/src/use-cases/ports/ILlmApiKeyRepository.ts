import type { LlmApiKey } from '#src/domain/llmApiKey/LlmApiKey.js';

export interface UpsertLlmApiKeyData {
  id: string;
  userId: string;
  provider: string;
  apiKey: string;
  model: string | null;
  baseUrl: string | null;
}

export interface ILlmApiKeyRepository {
  /** Insert a new key, or replace the existing one for this user+provider. */
  upsert(data: UpsertLlmApiKeyData): Promise<LlmApiKey>;
  findByUserIdAndProvider(userId: string, provider: string): Promise<LlmApiKey | null>;
  findAllByUserId(userId: string): Promise<LlmApiKey[]>;
  /**
   * Sets (or clears, with null) this key's monthly token ceiling.
   * Returns null when the user has no key for that provider — separate from
   * `upsert` so saving a new API key never disturbs the limit already on it.
   */
  setMonthlyTokenLimit(
    userId: string,
    provider: string,
    monthlyTokenLimit: number | null,
  ): Promise<LlmApiKey | null>;
  delete(userId: string, provider: string): Promise<void>;
}
