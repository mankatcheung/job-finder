import { createHash } from 'node:crypto';
import { MCP_OAUTH } from '#src/constants.js';
import type { McpOAuthScope } from '#src/domain/mcpOAuth/McpOAuthAccessToken.js';
import type { IMcpOAuthTokenRepository } from '#src/use-cases/ports/IMcpOAuthTokenRepository.js';

interface Deps {
  repository: IMcpOAuthTokenRepository;
  now?: () => Date;
}

export interface ValidateMcpOAuthAccessTokenResult {
  sub: string;
  scope: McpOAuthScope;
}

export class ValidateMcpOAuthAccessTokenUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(rawToken: string): Promise<ValidateMcpOAuthAccessTokenResult | null> {
    if (!rawToken.startsWith(MCP_OAUTH.ACCESS_TOKEN_PREFIX)) return null;

    const token = await this.deps.repository.findByTokenHash(
      createHash('sha256').update(rawToken).digest('hex'),
    );
    if (!token || token.audience !== MCP_OAUTH.RESOURCE || token.revokedAt) return null;

    const now = this.deps.now ?? (() => new Date());
    if (token.expiresAt.getTime() <= now().getTime()) return null;

    await this.deps.repository.updateLastUsed(token.id);
    return { sub: token.userId, scope: token.scope };
  }
}
