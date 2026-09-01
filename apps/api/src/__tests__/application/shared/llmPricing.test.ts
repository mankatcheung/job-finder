import { describe, it, expect } from 'vitest';
import { estimateCostUsd } from '#src/use-cases/shared/llmPricing.js';

describe('estimateCostUsd', () => {
  it('computes cost from the known per-provider default-model rate', () => {
    const cost = estimateCostUsd('openai', 'gpt-4o-mini', 1_000_000, 1_000_000);

    expect(cost).toBeCloseTo(0.15 + 0.6, 5);
  });

  it('returns null for the custom provider regardless of model', () => {
    expect(estimateCostUsd('custom', 'anything', 100, 100)).toBeNull();
  });

  it('returns null for a model not in the pricing table', () => {
    expect(estimateCostUsd('openai', 'some-future-model', 100, 100)).toBeNull();
  });

  it('returns null when model is null', () => {
    expect(estimateCostUsd('openai', null, 100, 100)).toBeNull();
  });

  it('returns 0 for zero usage on a known model, not null', () => {
    expect(estimateCostUsd('openai', 'gpt-4o-mini', 0, 0)).toBe(0);
  });
});
