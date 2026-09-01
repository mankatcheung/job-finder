import { createHash, randomBytes } from 'node:crypto';
import { MCP_OAUTH } from '#src/use-cases/constants.js';
import type { McpOAuthRefreshToken } from '#src/domain/mcpOAuth/McpOAuthRefreshToken.js';
import type { McpOAuthScope } from '#src/domain/mcpOAuth/McpOAuthAccessToken.js';
import type { IMcpOAuthRefreshTokenRepository } from '#src/use-cases/ports/IMcpOAuthRefreshTokenRepository.js';

interface Deps {
  mcpOAuthRefreshTokenRepository: IMcpOAuthRefreshTokenRepository;
  generateId: () => string;
  now: () => Date;
}

export interface CreateMcpOAuthRefreshTokenInput {
  userId: string;
  clientId: string;
  scope: McpOAuthScope;
  /** The grant this token belongs to. Required: the grant id is minted with
   * the authorization code, never here, so a refresh token can never start a
   * family that its own access tokens are not part of. */
  familyId: string;
}

export interface CreateMcpOAuthRefreshTokenOutput {
  token: McpOAuthRefreshToken;
  rawToken: string;
}

export class CreateMcpOAuthRefreshTokenUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: CreateMcpOAuthRefreshTokenInput): Promise<CreateMcpOAuthRefreshTokenOutput> {
    const rawToken = `${MCP_OAUTH.REFRESH_TOKEN_PREFIX}${randomBytes(
      MCP_OAUTH.REFRESH_TOKEN_RANDOM_BYTES,
    ).toString('hex')}`;
    const token = await this.deps.mcpOAuthRefreshTokenRepository.create({
      id: this.deps.generateId(),
      tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      familyId: input.familyId,
      clientId: input.clientId,
      userId: input.userId,
      scope: input.scope,
      expiresAt: new Date(this.deps.now().getTime() + MCP_OAUTH.REFRESH_TOKEN_TTL_MS),
    });
    return { token, rawToken };
  }
}
