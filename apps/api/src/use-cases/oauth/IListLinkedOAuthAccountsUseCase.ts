import type { OAuthAccount } from '@/domain/oauthAccount/OAuthAccount.js';

export interface IListLinkedOAuthAccountsUseCase {
  execute(userId: string): Promise<OAuthAccount[]>;
}
