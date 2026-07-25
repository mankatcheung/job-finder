import type { OAuthProviderName } from '@/domain/oauthAccount/OAuthAccount.js';
import type { IOAuthProvider } from '@/use-cases/ports/IOAuthProvider.js';

export interface IOAuthProviderRegistry {
  get(provider: OAuthProviderName): IOAuthProvider;
}
