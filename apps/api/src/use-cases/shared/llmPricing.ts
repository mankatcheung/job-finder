import { LLM_PROVIDER } from '#src/constants.js';

interface Price {
  /** USD per 1M prompt tokens. */
  promptPerMillion: number;
  /** USD per 1M completion tokens. */
  completionPerMillion: number;
}

/**
 * Known list-price rates, keyed by `${provider}:${model}` (JEF-250) — covers
 * only each provider's default model, the common case (most users never
 * override it). A custom or non-default model isn't priced: rather than
 * guess, `estimateCostUsd` returns `null` and the caller shows token counts
 * only. Rates drift over time and are not fetched live; treat this as an
 * estimate, not a bill.
 */
const PRICING: Record<string, Price> = {
  'openai:gpt-4o-mini': { promptPerMillion: 0.15, completionPerMillion: 0.6 },
  'anthropic:claude-3-5-haiku-latest': { promptPerMillion: 0.8, completionPerMillion: 4.0 },
  'googleai:gemini-2.0-flash': { promptPerMillion: 0.1, completionPerMillion: 0.4 },
  'openrouter:openai/gpt-4o-mini': { promptPerMillion: 0.15, completionPerMillion: 0.6 },
  'mistral:mistral-small-latest': { promptPerMillion: 0.1, completionPerMillion: 0.3 },
  'groq:llama-3.3-70b-versatile': { promptPerMillion: 0.59, completionPerMillion: 0.79 },
  'xai:grok-2-latest': { promptPerMillion: 2.0, completionPerMillion: 10.0 },
  'deepseek:deepseek-chat': { promptPerMillion: 0.28, completionPerMillion: 0.42 },
  // NVIDIA NIM and any `custom` endpoint have no stable public list price to
  // key off of — deliberately unpriced.
};

/**
 * `null` for `LLM_PROVIDER.CUSTOM`, a `model` not in `PRICING`, or a `model`
 * of `null` (nothing to key on) — never a guessed number.
 */
export function estimateCostUsd(
  provider: string,
  model: string | null,
  promptTokens: number,
  completionTokens: number,
): number | null {
  if (provider === LLM_PROVIDER.CUSTOM || !model) return null;

  const price = PRICING[`${provider}:${model}`];
  if (!price) return null;

  return (
    (promptTokens / 1_000_000) * price.promptPerMillion +
    (completionTokens / 1_000_000) * price.completionPerMillion
  );
}
