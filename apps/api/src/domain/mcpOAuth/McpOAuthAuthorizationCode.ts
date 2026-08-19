import type { McpOAuthScope } from './McpOAuthAccessToken.js';

export interface McpOAuthAuthorizationCode {
  id: string;
  codeHash: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: McpOAuthScope;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}
