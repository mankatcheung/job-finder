export type McpOAuthScope = 'read' | 'full';

export interface McpOAuthAccessToken {
  id: string;
  userId: string;
  clientId: string;
  /** Grant id shared with the authorization code and refresh tokens. */
  familyId: string;
  tokenHash: string;
  scope: McpOAuthScope;
  audience: string;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}
