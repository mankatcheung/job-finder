import type { OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';
import type { IOAuthProvider } from '#src/use-cases/ports/IOAuthProvider.js';
import type { IOAuthProviderRegistry } from '#src/use-cases/ports/IOAuthProviderRegistry.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

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
