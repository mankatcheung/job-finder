import type { OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';

export interface LinkOAuthAccountInput {
  userId: string;
  provider: OAuthProviderName;
  code: string;
  redirectUri: string;
}

export interface ILinkOAuthAccountUseCase {
  execute(input: LinkOAuthAccountInput): Promise<void>;
}
