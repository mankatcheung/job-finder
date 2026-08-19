import type {
  McpOAuthAccessToken,
  McpOAuthScope,
} from '#src/domain/mcpOAuth/McpOAuthAccessToken.js';

export interface CreateMcpOAuthAccessTokenData {
  id: string;
  userId: string;
  clientId: string;
  familyId: string;
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
  /** Revokes every access token minted under one grant. */
  revokeFamily(familyId: string, revokedAt: Date): Promise<void>;
}
