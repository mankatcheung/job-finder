import type { McpOAuthGrant } from '#src/domain/mcpOAuth/McpOAuthGrant.js';
import type { McpOAuthScope } from '#src/domain/mcpOAuth/McpOAuthAccessToken.js';

export interface McpOAuthGrantDTO {
  id: string;
  clientName: string;
  scope: McpOAuthScope;
  authorizedAt: string;
  lastUsedAt: string | null;
}

export class McpOAuthGrantMapper {
  toDTO(grant: McpOAuthGrant): McpOAuthGrantDTO {
    // clientId is deliberately not exposed: it identifies the OAuth client
    // registration, and the user's question is "which app is this", which the
    // name answers.
    return {
      id: grant.id,
      clientName: grant.clientName,
      scope: grant.scope,
      authorizedAt: grant.authorizedAt.toISOString(),
      lastUsedAt: grant.lastUsedAt?.toISOString() ?? null,
    };
  }
}
