import type { OAuthProviderName } from '@/domain/oauthAccount/OAuthAccount.js';

export interface UnlinkOAuthAccountInput {
  userId: string;
  provider: OAuthProviderName;
}

export interface IUnlinkOAuthAccountUseCase {
  execute(input: UnlinkOAuthAccountInput): Promise<void>;
}
