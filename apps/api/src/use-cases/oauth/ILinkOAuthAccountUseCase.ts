import type { OAuthProviderName } from '@/domain/oauthAccount/OAuthAccount.js';

export interface LinkOAuthAccountInput {
  userId: string;
  provider: OAuthProviderName;
  code: string;
  redirectUri: string;
}

export interface ILinkOAuthAccountUseCase {
  execute(input: LinkOAuthAccountInput): Promise<void>;
}
