import type { McpOAuthAuthorizationCode } from '#src/domain/mcpOAuth/McpOAuthAuthorizationCode.js';

export interface CreateMcpOAuthAuthorizationCodeData {
  id: string;
  codeHash: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: McpOAuthAuthorizationCode['scope'];
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  expiresAt: Date;
}

export interface IMcpOAuthAuthorizationCodeRepository {
  create(data: CreateMcpOAuthAuthorizationCodeData): Promise<McpOAuthAuthorizationCode>;
  findByCodeHash(codeHash: string): Promise<McpOAuthAuthorizationCode | null>;
  consume(id: string, consumedAt: Date): Promise<boolean>;
}
