import type { McpOAuthScope } from './McpOAuthAccessToken.js';

export interface McpOAuthRefreshToken {
  id: string;
  tokenHash: string;
  familyId: string;
  clientId: string;
  userId: string;
  scope: McpOAuthScope;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}
