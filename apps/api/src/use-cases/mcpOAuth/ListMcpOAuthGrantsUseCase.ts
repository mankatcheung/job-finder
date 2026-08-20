import type { McpOAuthGrant } from '#src/domain/mcpOAuth/McpOAuthGrant.js';
import type { IMcpOAuthGrantRepository } from '#src/use-cases/ports/IMcpOAuthGrantRepository.js';

interface Deps {
  mcpOAuthGrantRepository: IMcpOAuthGrantRepository;
  now: () => Date;
}

/** The MCP clients this user has authorized and not since revoked. */
export class ListMcpOAuthGrantsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<McpOAuthGrant[]> {
    return this.deps.mcpOAuthGrantRepository.findActiveByUserId(userId, this.deps.now());
  }
}
