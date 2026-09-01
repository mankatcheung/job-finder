import { createHash, randomBytes } from 'node:crypto';
import type {
  McpOAuthAccessToken,
  McpOAuthScope,
} from '#src/domain/mcpOAuth/McpOAuthAccessToken.js';
import { MCP_OAUTH } from '#src/use-cases/constants.js';
import type { IMcpOAuthTokenRepository } from '#src/use-cases/ports/IMcpOAuthTokenRepository.js';

interface Deps {
  mcpOAuthTokenRepository: IMcpOAuthTokenRepository;
  generateId: () => string;
  now: () => Date;
}

export interface CreateMcpOAuthAccessTokenInput {
  userId: string;
  clientId: string;
  /** The grant this token belongs to; see McpOAuthAccessToken.familyId. */
  familyId: string;
  scope: McpOAuthScope;
}

export interface CreateMcpOAuthAccessTokenOutput {
  token: McpOAuthAccessToken;
  rawToken: string;
}

export class CreateMcpOAuthAccessTokenUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateMcpOAuthAccessTokenInput): Promise<CreateMcpOAuthAccessTokenOutput> {
    const rawToken = `${MCP_OAUTH.ACCESS_TOKEN_PREFIX}${randomBytes(
      MCP_OAUTH.ACCESS_TOKEN_RANDOM_BYTES,
    ).toString('hex')}`;
    const token = await this.deps.mcpOAuthTokenRepository.create({
      id: this.deps.generateId(),
      userId: input.userId,
      clientId: input.clientId,
      familyId: input.familyId,
      tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      scope: input.scope,
      audience: MCP_OAUTH.RESOURCE,
      expiresAt: new Date(this.deps.now().getTime() + MCP_OAUTH.ACCESS_TOKEN_TTL_MS),
    });

    return { token, rawToken };
  }
}
