import type { McpOAuthGrant } from '#src/domain/mcpOAuth/McpOAuthGrant.js';

export interface IMcpOAuthGrantRepository {
  /**
   * Every grant of this user's that a client could still act on — one entry
   * per consent, not per token. A grant is live while it holds an unrevoked,
   * unexpired refresh token, which is what lets a client keep minting access
   * tokens; an access token expiring an hour after it was issued does not mean
   * the client has lost access.
   */
  findActiveByUserId(userId: string, now: Date): Promise<McpOAuthGrant[]>;
}
