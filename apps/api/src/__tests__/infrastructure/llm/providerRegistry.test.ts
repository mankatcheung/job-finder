import { describe, it, expect } from 'vitest';
import { PROVIDER_REGISTRY } from '#src/infrastructure/llm/providerRegistry.js';
import { LLM_PROVIDER } from '#src/constants.js';

describe('PROVIDER_REGISTRY', () => {
  it('has an entry for every LLM_PROVIDER value', () => {
    for (const provider of Object.values(LLM_PROVIDER)) {
      expect(PROVIDER_REGISTRY[provider]).toBeDefined();
      expect(PROVIDER_REGISTRY[provider].label).toBeTruthy();
    }
  });

  it('throws when creating the custom provider without a base URL', () => {
    expect(() =>
      PROVIDER_REGISTRY[LLM_PROVIDER.CUSTOM].create({
        apiKey: 'key',
        model: 'some-model',
        baseUrl: null,
      }),
    ).toThrow('Custom provider requires both a base URL and a model');
  });

  it('throws when creating the custom provider without a model', () => {
    expect(() =>
      PROVIDER_REGISTRY[LLM_PROVIDER.CUSTOM].create({
        apiKey: 'key',
        model: null,
        baseUrl: 'https://example.com/v1/chat/completions',
      }),
    ).toThrow('Custom provider requires both a base URL and a model');
  });

  it('creates a provider for custom when both are supplied', () => {
    const provider = PROVIDER_REGISTRY[LLM_PROVIDER.CUSTOM].create({
      apiKey: 'key',
      model: 'some-model',
      baseUrl: 'https://example.com/v1/chat/completions',
    });
    expect(provider).toBeDefined();
  });
});
