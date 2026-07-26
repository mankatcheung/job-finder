import type { OAuthAccount } from '#src/domain/oauthAccount/OAuthAccount.js';

export interface IListLinkedOAuthAccountsUseCase {
  execute(userId: string): Promise<OAuthAccount[]>;
}
