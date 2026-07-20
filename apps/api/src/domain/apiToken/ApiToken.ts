export type ApiTokenScope = 'full' | 'read';

export interface ApiToken {
  id: string;
  userId: string;
  name: string;
  tokenHash: string;
  scope: ApiTokenScope;
  lastUsedAt: Date | null;
  createdAt: Date;
}
