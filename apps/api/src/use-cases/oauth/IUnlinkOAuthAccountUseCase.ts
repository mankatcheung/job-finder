import type { OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';

export interface UnlinkOAuthAccountInput {
  userId: string;
  provider: OAuthProviderName;
}

export interface IUnlinkOAuthAccountUseCase {
  execute(input: UnlinkOAuthAccountInput): Promise<void>;
}
