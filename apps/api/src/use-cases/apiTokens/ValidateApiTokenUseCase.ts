import { createHash } from 'crypto';
import type { IApiTokenRepository } from '#src/use-cases/ports/IApiTokenRepository.js';
import type { ApiTokenScope } from '#src/domain/apiToken/ApiToken.js';

interface Deps {
  apiTokenRepository: IApiTokenRepository;
}

export interface ValidateApiTokenResult {
  sub: string;
  email: string;
  scope: ApiTokenScope;
}

export class ValidateApiTokenUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(rawToken: string): Promise<ValidateApiTokenResult | null> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const result = await this.deps.apiTokenRepository.findByTokenHash(tokenHash);
    if (!result) return null;

    await this.deps.apiTokenRepository.updateLastUsed(result.token.id);

    return { sub: result.token.userId, email: result.userEmail, scope: result.token.scope };
  }
}
