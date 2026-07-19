import type { ApiToken } from '@/domain/apiToken/ApiToken.js';

export interface CreateApiTokenData {
  id: string;
  userId: string;
  name: string;
  tokenHash: string;
}

export interface IApiTokenRepository {
  findAllByUserId(userId: string): Promise<ApiToken[]>;
  findByTokenHash(tokenHash: string): Promise<{ token: ApiToken; userEmail: string } | null>;
  create(data: CreateApiTokenData): Promise<ApiToken>;
  updateLastUsed(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  findByIdAndUserId(id: string, userId: string): Promise<ApiToken | null>;
}
