import type { ILLMProvider } from '#src/use-cases/ports/ILLMProvider.js';

/**
 * Resolves the LLM provider to use for a given user's own API key —
 * returns null when the user hasn't configured one (AI features are simply
 * unavailable in that case, there is no shared/fallback key).
 *
 * When `provider` is omitted, resolves the user's configured default
 * (`User.defaultLlmProvider`) — used by the automatic AI features (cover
 * letter, JD parsing, resume match). The assistant passes an explicit
 * provider since each conversation picks its own.
 *
 * `model` overrides the model stored on that provider's `LlmApiKey` row —
 * used when a conversation locked in a specific model at creation time.
 */
export interface LLMProviderCredentials {
  provider: string;
  apiKey: string;
  model?: string | null;
  baseUrl?: string | null;
}

export interface ILLMProviderFactory {
  /**
   * `trackUsage` (default `true`) gates the `UsageTrackingLLMProvider` wrap
   * (JEF-250) — every real AI feature leaves it at the default; the one
   * caller that passes `false` is `TestLlmApiKeyUseCase`'s "test a saved
   * key" path, which resolves through here too but isn't real usage.
   */
  forUser(
    userId: string,
    provider?: string,
    model?: string | null,
    trackUsage?: boolean,
  ): Promise<ILLMProvider | null>;
  /**
   * Builds a provider directly from raw, not-yet-persisted credentials —
   * `TestLlmApiKeyUseCase`'s "test before you save" path (JEF-247), which
   * has no `LlmApiKey` row to look up. Synchronous and side-effect-free
   * (no DB access, nothing decrypted): unlike `forUser`, there's nothing
   * stored to read yet. Returns null for an unrecognized `provider` id.
   */
  fromCredentials(credentials: LLMProviderCredentials): ILLMProvider | null;
}
