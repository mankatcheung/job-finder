import { describe, it, expect } from 'vitest';
import { OAuthProviderRegistry } from '@/infrastructure/auth/OAuthProviderRegistry.js';
import { makeOAuthProvider } from '@/__tests__/helpers/mocks.js';

describe('OAuthProviderRegistry', () => {
  it('resolves google to the google provider instance', () => {
    const googleOAuthProvider = makeOAuthProvider();
    const registry = new OAuthProviderRegistry({
      googleOAuthProvider,
      gitHubOAuthProvider: makeOAuthProvider(),
    });

    expect(registry.get('google')).toBe(googleOAuthProvider);
  });

  it('resolves github to the github provider instance', () => {
    const gitHubOAuthProvider = makeOAuthProvider();
    const registry = new OAuthProviderRegistry({
      googleOAuthProvider: makeOAuthProvider(),
      gitHubOAuthProvider,
    });

    expect(registry.get('github')).toBe(gitHubOAuthProvider);
  });

  it('throws VALIDATION for an unknown provider', () => {
    const registry = new OAuthProviderRegistry({
      googleOAuthProvider: makeOAuthProvider(),
      gitHubOAuthProvider: makeOAuthProvider(),
    });

    let err: unknown;
    try {
      registry.get('twitter' as never);
    } catch (e) {
      err = e;
    }

    expect((err as { code: string }).code).toBe('VALIDATION');
  });
});
