import type { ListMcpOAuthGrantsUseCase } from '#src/use-cases/mcpOAuth/ListMcpOAuthGrantsUseCase.js';
import type { RevokeMcpOAuthGrantForUserUseCase } from '#src/use-cases/mcpOAuth/RevokeMcpOAuthGrantForUserUseCase.js';
import type {
  McpOAuthGrantMapper,
  McpOAuthGrantDTO,
} from '#src/interface-adapters/mappers/McpOAuthGrantMapper.js';

interface Deps {
  listMcpOAuthGrantsUseCase: ListMcpOAuthGrantsUseCase;
  revokeMcpOAuthGrantForUserUseCase: RevokeMcpOAuthGrantForUserUseCase;
  mcpOAuthGrantMapper: McpOAuthGrantMapper;
}

export class McpOAuthGrantResolver {
  constructor(private readonly deps: Deps) {}

  async listGrants(userId: string): Promise<McpOAuthGrantDTO[]> {
    const grants = await this.deps.listMcpOAuthGrantsUseCase.execute(userId);
    return grants.map((grant) => this.deps.mcpOAuthGrantMapper.toDTO(grant));
  }

  async revokeGrant(userId: string, grantId: string): Promise<boolean> {
    return this.deps.revokeMcpOAuthGrantForUserUseCase.execute(userId, grantId);
  }
}
