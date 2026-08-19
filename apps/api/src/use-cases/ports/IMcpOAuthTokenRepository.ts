import type {
  McpOAuthAccessToken,
  McpOAuthScope,
} from '#src/domain/mcpOAuth/McpOAuthAccessToken.js';

export interface CreateMcpOAuthAccessTokenData {
  id: string;
  userId: string;
  clientId: string;
  tokenHash: string;
  scope: McpOAuthScope;
  audience: string;
  expiresAt: Date;
}

export interface IMcpOAuthTokenRepository {
  create(data: CreateMcpOAuthAccessTokenData): Promise<McpOAuthAccessToken>;
  findByTokenHash(tokenHash: string): Promise<McpOAuthAccessToken | null>;
  updateLastUsed(id: string): Promise<void>;
  revoke(id: string): Promise<void>;
}
