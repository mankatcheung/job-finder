import type { OAuthAccount, OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';

export interface IOAuthAccountRepository {
  findByProvider(
    provider: OAuthProviderName,
    providerAccountId: string,
  ): Promise<OAuthAccount | null>;
  findAllByUserId(userId: string): Promise<OAuthAccount[]>;
  create(data: {
    id: string;
    userId: string;
    provider: OAuthProviderName;
    providerAccountId: string;
    email: string | null;
  }): Promise<OAuthAccount>;
  delete(id: string): Promise<void>;
}
