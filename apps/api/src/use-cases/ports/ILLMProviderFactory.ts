import type { ILLMProvider } from '#src/use-cases/ports/ILLMProvider.js';

/**
 * Resolves the LLM provider to use for a given user's own API key —
 * returns null when the user hasn't configured one (AI features are simply
 * unavailable in that case, there is no shared/fallback key).
 */
export interface ILLMProviderFactory {
  forUser(userId: string): Promise<ILLMProvider | null>;
}
