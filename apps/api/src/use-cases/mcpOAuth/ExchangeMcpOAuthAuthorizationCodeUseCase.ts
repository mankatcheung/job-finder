import { createHash, timingSafeEqual } from 'node:crypto';
import { MCP_OAUTH } from '#src/constants.js';
import type { CreateMcpOAuthAccessTokenUseCase } from './CreateMcpOAuthAccessTokenUseCase.js';
import type { CreateMcpOAuthRefreshTokenUseCase } from './CreateMcpOAuthRefreshTokenUseCase.js';
import type { McpOAuthAccessToken } from '#src/domain/mcpOAuth/McpOAuthAccessToken.js';
import type { IMcpOAuthAuthorizationCodeRepository } from '#src/use-cases/ports/IMcpOAuthAuthorizationCodeRepository.js';
import type { IMcpOAuthClientRepository } from '#src/use-cases/ports/IMcpOAuthClientRepository.js';

interface Deps {
  mcpOAuthAuthorizationCodeRepository: IMcpOAuthAuthorizationCodeRepository;
  mcpOAuthClientRepository: IMcpOAuthClientRepository;
  createMcpOAuthAccessTokenUseCase: Pick<CreateMcpOAuthAccessTokenUseCase, 'execute'>;
  createMcpOAuthRefreshTokenUseCase: Pick<CreateMcpOAuthRefreshTokenUseCase, 'execute'>;
  now: () => Date;
}

export interface ExchangeMcpOAuthAuthorizationCodeInput {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}

export interface ExchangeMcpOAuthAuthorizationCodeOutput {
  accessToken: string;
  refreshToken: string;
  token: McpOAuthAccessToken;
}

export class ExchangeMcpOAuthAuthorizationCodeUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(
    input: ExchangeMcpOAuthAuthorizationCodeInput,
  ): Promise<ExchangeMcpOAuthAuthorizationCodeOutput | null> {
    if (!input.code.startsWith(MCP_OAUTH.AUTHORIZATION_CODE_PREFIX)) return null;

    const client = await this.deps.mcpOAuthClientRepository.findById(input.clientId);
    if (!client || client.revokedAt || !client.redirectUris.includes(input.redirectUri))
      return null;

    const code = await this.deps.mcpOAuthAuthorizationCodeRepository.findByCodeHash(
      createHash('sha256').update(input.code).digest('hex'),
    );
    if (!code || code.clientId !== input.clientId || code.redirectUri !== input.redirectUri) {
      return null;
    }

    if (code.consumedAt || code.expiresAt.getTime() <= this.deps.now().getTime()) return null;
    if (
      code.codeChallengeMethod !== 'S256' ||
      !matchesPkce(input.codeVerifier, code.codeChallenge)
    ) {
      return null;
    }

    const consumed = await this.deps.mcpOAuthAuthorizationCodeRepository.consume(
      code.id,
      this.deps.now(),
    );
    if (!consumed) return null;

    const token = await this.deps.createMcpOAuthAccessTokenUseCase.execute({
      userId: code.userId,
      clientId: code.clientId,
      scope: code.scope,
    });
    const refreshToken = await this.deps.createMcpOAuthRefreshTokenUseCase.execute({
      userId: code.userId,
      clientId: code.clientId,
      scope: code.scope,
    });
    return { accessToken: token.rawToken, refreshToken: refreshToken.rawToken, token: token.token };
  }
}

function matchesPkce(verifier: string, expectedChallenge: string): boolean {
  const actual = createHash('sha256').update(verifier).digest('base64url');
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expectedChallenge);
  return (
    actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
