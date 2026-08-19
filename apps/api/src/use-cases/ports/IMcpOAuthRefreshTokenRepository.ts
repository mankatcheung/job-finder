import type { McpOAuthRefreshToken } from '#src/domain/mcpOAuth/McpOAuthRefreshToken.js';

export interface CreateMcpOAuthRefreshTokenData {
  id: string;
  tokenHash: string;
  familyId: string;
  clientId: string;
  userId: string;
  scope: McpOAuthRefreshToken['scope'];
  expiresAt: Date;
}

export interface IMcpOAuthRefreshTokenRepository {
  create(data: CreateMcpOAuthRefreshTokenData): Promise<McpOAuthRefreshToken>;
  findByTokenHash(tokenHash: string): Promise<McpOAuthRefreshToken | null>;
  markUsed(id: string, usedAt: Date): Promise<boolean>;
  revokeFamily(familyId: string, revokedAt: Date): Promise<void>;
}
