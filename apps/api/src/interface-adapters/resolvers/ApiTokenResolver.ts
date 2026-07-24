import type { CreateApiTokenUseCase } from '@/use-cases/apiTokens/CreateApiTokenUseCase.js';
import type { DeleteApiTokenUseCase } from '@/use-cases/apiTokens/DeleteApiTokenUseCase.js';
import type { ListApiTokensUseCase } from '@/use-cases/apiTokens/ListApiTokensUseCase.js';
import type { ApiTokenMapper, ApiTokenDTO } from '@/interface-adapters/mappers/ApiTokenMapper.js';
import type { ApiTokenScope } from '@/domain/apiToken/ApiToken.js';

interface Deps {
  createApiTokenUseCase: CreateApiTokenUseCase;
  deleteApiTokenUseCase: DeleteApiTokenUseCase;
  listApiTokensUseCase: ListApiTokensUseCase;
  apiTokenMapper: ApiTokenMapper;
}

export interface CreateApiTokenResult {
  id: string;
  name: string;
  token: string;
  scope: ApiTokenScope;
  createdAt: string;
}

export class ApiTokenResolver {
  constructor(private readonly deps: Deps) {}

  async createApiToken(
    userId: string,
    name: string,
    scope?: ApiTokenScope,
  ): Promise<CreateApiTokenResult> {
    const { token, rawToken } = await this.deps.createApiTokenUseCase.execute({
      userId,
      name,
      scope,
    });
    const dto = this.deps.apiTokenMapper.toDTO(token);
    return {
      id: dto.id,
      name: dto.name,
      token: rawToken,
      scope: dto.scope,
      createdAt: dto.createdAt,
    };
  }

  async deleteApiToken(userId: string, id: string): Promise<boolean> {
    await this.deps.deleteApiTokenUseCase.execute(id, userId);
    return true;
  }

  async listApiTokens(userId: string): Promise<ApiTokenDTO[]> {
    const tokens = await this.deps.listApiTokensUseCase.execute(userId);
    return tokens.map((token) => this.deps.apiTokenMapper.toDTO(token));
  }
}
