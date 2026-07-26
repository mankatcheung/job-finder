import type { IApiTokenRepository } from '#src/use-cases/ports/IApiTokenRepository.js';
import type { ApiToken } from '#src/domain/apiToken/ApiToken.js';

interface Deps {
  apiTokenRepository: IApiTokenRepository;
}

export class ListApiTokensUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(userId: string): Promise<ApiToken[]> {
    return this.deps.apiTokenRepository.findAllByUserId(userId);
  }
}
