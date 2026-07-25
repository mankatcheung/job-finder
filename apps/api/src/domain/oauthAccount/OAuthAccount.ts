export type OAuthProviderName = 'google' | 'github';

export interface OAuthAccount {
  id: string;
  userId: string;
  provider: OAuthProviderName;
  providerAccountId: string;
  email: string | null;
  createdAt: Date;
}
