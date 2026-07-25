import type { OAuthProviderName } from '@/domain/oauthAccount/OAuthAccount.js';
import type { IOAuthProvider } from '@/use-cases/ports/IOAuthProvider.js';
import type { IOAuthProviderRegistry } from '@/use-cases/ports/IOAuthProviderRegistry.js';
import { ERROR_CODES } from '@/constants.js';

interface Deps {
  googleOAuthProvider: IOAuthProvider;
  gitHubOAuthProvider: IOAuthProvider;
}

export class OAuthProviderRegistry implements IOAuthProviderRegistry {
  constructor(private readonly deps: Deps) {}

  get(provider: OAuthProviderName): IOAuthProvider {
    switch (provider) {
      case 'google':
        return this.deps.googleOAuthProvider;
      case 'github':
        return this.deps.gitHubOAuthProvider;
      default:
        throw Object.assign(new Error(`Unknown OAuth provider: ${String(provider)}`), {
          code: ERROR_CODES.VALIDATION,
        });
    }
  }
}
