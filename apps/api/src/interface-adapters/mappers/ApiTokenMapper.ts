import type { ApiToken, ApiTokenScope } from '#src/domain/apiToken/ApiToken.js';

export interface ApiTokenDTO {
  id: string;
  userId: string;
  name: string;
  scope: ApiTokenScope;
  lastUsedAt: string | null;
  createdAt: string;
}

export class ApiTokenMapper {
  toDTO(token: ApiToken): ApiTokenDTO {
    return {
      id: token.id,
      userId: token.userId,
      name: token.name,
      scope: token.scope,
      lastUsedAt: token.lastUsedAt?.toISOString() ?? null,
      createdAt: token.createdAt.toISOString(),
    };
  }
}
