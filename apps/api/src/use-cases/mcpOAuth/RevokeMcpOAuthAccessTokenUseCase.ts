import { createHash } from 'node:crypto';
import { MCP_OAUTH } from '#src/constants.js';
import type { IMcpOAuthTokenRepository } from '#src/use-cases/ports/IMcpOAuthTokenRepository.js';

interface Deps {
  mcpOAuthTokenRepository: IMcpOAuthTokenRepository;
}

export class RevokeMcpOAuthAccessTokenUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(rawToken: string): Promise<void> {
    if (!rawToken.startsWith(MCP_OAUTH.ACCESS_TOKEN_PREFIX)) return;
    const token = await this.deps.mcpOAuthTokenRepository.findByTokenHash(
      createHash('sha256').update(rawToken).digest('hex'),
    );
    if (token) await this.deps.mcpOAuthTokenRepository.revoke(token.id);
  }
}
