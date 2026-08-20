import type { McpOAuthScope } from './McpOAuthAccessToken.js';

/**
 * One consent, as the user who gave it would describe it: this client, this
 * much access, since then.
 *
 * Not a table. A grant is the `familyId` that ties an authorization code to
 * every access and refresh token descended from it, so this is assembled from
 * those — the code records what was consented to and when, the refresh tokens
 * say whether it is still live, and the access tokens say when it was last
 * used.
 */
export interface McpOAuthGrant {
  /** The grant id, i.e. the familyId. Revoking this ends the whole grant. */
  id: string;
  userId: string;
  clientId: string;
  /** The name the client registered itself under. */
  clientName: string;
  scope: McpOAuthScope;
  authorizedAt: Date;
  /** When a token from this grant last reached /mcp; null if never used. */
  lastUsedAt: Date | null;
}
