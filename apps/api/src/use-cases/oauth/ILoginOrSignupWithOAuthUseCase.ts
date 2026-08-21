import type { OAuthProviderName } from '#src/domain/oauthAccount/OAuthAccount.js';
import type { User } from '#src/domain/user/User.js';

export interface LoginOrSignupWithOAuthInput {
  provider: OAuthProviderName;
  code: string;
  redirectUri: string;
  /** PKCE verifier held server-side since /start; proves this exchange belongs to that flow. */
  codeVerifier: string;
}

export interface LoginOrSignupWithOAuthOutput {
  user: User;
  isNewUser: boolean;
}

export interface ILoginOrSignupWithOAuthUseCase {
  execute(input: LoginOrSignupWithOAuthInput): Promise<LoginOrSignupWithOAuthOutput>;
}
