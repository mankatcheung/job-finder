import { createHash } from 'node:crypto';
import { MCP_OAUTH } from '#src/constants.js';
import type { CreateMcpOAuthAccessTokenUseCase } from './CreateMcpOAuthAccessTokenUseCase.js';
import type { CreateMcpOAuthRefreshTokenUseCase } from './CreateMcpOAuthRefreshTokenUseCase.js';
import type { IMcpOAuthClientRepository } from '#src/use-cases/ports/IMcpOAuthClientRepository.js';
import type { IMcpOAuthRefreshTokenRepository } from '#src/use-cases/ports/IMcpOAuthRefreshTokenRepository.js';

interface Deps {
  mcpOAuthRefreshTokenRepository: IMcpOAuthRefreshTokenRepository;
  mcpOAuthClientRepository: IMcpOAuthClientRepository;
  createMcpOAuthAccessTokenUseCase: Pick<CreateMcpOAuthAccessTokenUseCase, 'execute'>;
  createMcpOAuthRefreshTokenUseCase: Pick<CreateMcpOAuthRefreshTokenUseCase, 'execute'>;
  now: () => Date;
}

export interface RotateMcpOAuthRefreshTokenInput {
  refreshToken: string;
  clientId: string;
}

export interface RotateMcpOAuthRefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
}

export class RotateMcpOAuthRefreshTokenUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(
    input: RotateMcpOAuthRefreshTokenInput,
  ): Promise<RotateMcpOAuthRefreshTokenOutput | null> {
    if (!input.refreshToken.startsWith(MCP_OAUTH.REFRESH_TOKEN_PREFIX)) return null;
    const token = await this.deps.mcpOAuthRefreshTokenRepository.findByTokenHash(
      createHash('sha256').update(input.refreshToken).digest('hex'),
    );
    if (!token || token.clientId !== input.clientId) return null;

    const now = this.deps.now();
    if (token.revokedAt || token.expiresAt.getTime() <= now.getTime()) return null;
    if (token.usedAt) {
      await this.deps.mcpOAuthRefreshTokenRepository.revokeFamily(token.familyId, now);
      return null;
    }

    if (!(await this.deps.mcpOAuthRefreshTokenRepository.markUsed(token.id, now))) {
      await this.deps.mcpOAuthRefreshTokenRepository.revokeFamily(token.familyId, now);
      return null;
    }

    const accessToken = await this.deps.createMcpOAuthAccessTokenUseCase.execute({
      userId: token.userId,
      clientId: token.clientId,
      scope: token.scope,
    });
    const refreshToken = await this.deps.createMcpOAuthRefreshTokenUseCase.execute({
      userId: token.userId,
      clientId: token.clientId,
      scope: token.scope,
      familyId: token.familyId,
    });
    return {
      accessToken: accessToken.rawToken,
      refreshToken: refreshToken.rawToken,
      accessTokenExpiresAt: accessToken.token.expiresAt,
    };
  }
}
