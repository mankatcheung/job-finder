import type { OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';
import type { IOAuthProvider } from '#src/use-cases/ports/IOAuthProvider.js';

export interface IOAuthProviderRegistry {
  get(provider: OAuthProviderName): IOAuthProvider;
}
