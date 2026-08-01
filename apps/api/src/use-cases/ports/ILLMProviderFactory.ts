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
export interface ILLMProviderFactory {
  forUser(userId: string, provider?: string, model?: string | null): Promise<ILLMProvider | null>;
}
