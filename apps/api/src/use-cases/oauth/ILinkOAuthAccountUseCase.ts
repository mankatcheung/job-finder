import type { OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';

export interface LinkOAuthAccountInput {
  userId: string;
  provider: OAuthProviderName;
  code: string;
  redirectUri: string;
  /** PKCE verifier held server-side since /start; proves this exchange belongs to that flow. */
  codeVerifier: string;
}

export interface ILinkOAuthAccountUseCase {
  execute(input: LinkOAuthAccountInput): Promise<void>;
}
