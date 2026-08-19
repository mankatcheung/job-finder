import { createHash, randomBytes } from 'node:crypto';
import { MCP_OAUTH } from '#src/constants.js';
import type { McpOAuthAuthorizationCode } from '#src/domain/mcpOAuth/McpOAuthAuthorizationCode.js';
import type { McpOAuthScope } from '#src/domain/mcpOAuth/McpOAuthAccessToken.js';
import type { IMcpOAuthAuthorizationCodeRepository } from '#src/use-cases/ports/IMcpOAuthAuthorizationCodeRepository.js';

interface Deps {
  mcpOAuthAuthorizationCodeRepository: IMcpOAuthAuthorizationCodeRepository;
  generateId: () => string;
  now: () => Date;
}

export interface CreateMcpOAuthAuthorizationCodeInput {
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: McpOAuthScope;
  codeChallenge: string;
}

export interface CreateMcpOAuthAuthorizationCodeOutput {
  code: McpOAuthAuthorizationCode;
  rawCode: string;
}

export class CreateMcpOAuthAuthorizationCodeUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(
    input: CreateMcpOAuthAuthorizationCodeInput,
  ): Promise<CreateMcpOAuthAuthorizationCodeOutput> {
    const rawCode = `${MCP_OAUTH.AUTHORIZATION_CODE_PREFIX}${randomBytes(
      MCP_OAUTH.AUTHORIZATION_CODE_RANDOM_BYTES,
    ).toString('hex')}`;
    const code = await this.deps.mcpOAuthAuthorizationCodeRepository.create({
      id: this.deps.generateId(),
      codeHash: createHash('sha256').update(rawCode).digest('hex'),
      // The grant id is minted here, with the user's consent, and inherited by
      // every token descended from this code — so one revocation reaches all
      // of them and a replayed code can revoke what the first use produced.
      familyId: this.deps.generateId(),
      clientId: input.clientId,
      userId: input.userId,
      redirectUri: input.redirectUri,
      scope: input.scope,
      codeChallenge: input.codeChallenge,
      codeChallengeMethod: 'S256',
      expiresAt: new Date(this.deps.now().getTime() + MCP_OAUTH.AUTHORIZATION_CODE_TTL_MS),
    });

    return { code, rawCode };
  }
}
