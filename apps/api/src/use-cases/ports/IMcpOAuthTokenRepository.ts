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
  /**
   * Revokes every access token minted under one grant, and returns the hashes
   * of the ones it actually revoked.
   *
   * The return value exists for the caching decorator: it keys tokens by hash
   * and a grant id tells it nothing about which keys to drop. Reporting them
   * from the write itself avoids a second query to go and find out, and means
   * the set can never disagree with what was revoked.
   */
  revokeFamily(familyId: string, revokedAt: Date): Promise<string[]>;
}
