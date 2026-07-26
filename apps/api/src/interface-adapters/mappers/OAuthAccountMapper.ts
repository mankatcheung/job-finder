import type { OAuthAccount, OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';

export interface LinkedOAuthAccountDTO {
  provider: OAuthProviderName;
  email: string | null;
  createdAt: string;
}

export class OAuthAccountMapper {
  toDTO(account: OAuthAccount): LinkedOAuthAccountDTO {
    return {
      provider: account.provider,
      email: account.email,
      createdAt: account.createdAt.toISOString(),
    };
  }
}
