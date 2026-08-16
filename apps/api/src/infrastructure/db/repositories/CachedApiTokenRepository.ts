import type { ApiToken } from '#src/domain/apiToken/ApiToken.js';
import type {
  IApiTokenRepository,
  CreateApiTokenData,
} from '#src/use-cases/ports/IApiTokenRepository.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleApiTokenRepository: IApiTokenRepository;
  cache: ICache;
}

export class CachedApiTokenRepository implements IApiTokenRepository {
  private readonly inner: IApiTokenRepository;
  private readonly cache: ICache;

  constructor({ drizzleApiTokenRepository, cache }: Deps) {
    this.inner = drizzleApiTokenRepository;
    this.cache = cache;
  }

  async findAllByUserId(userId: string): Promise<ApiToken[]> {
    const key = CACHE_KEYS.apiTokenList(userId);
    return this.cache.getOrSet(key, () => this.inner.findAllByUserId(userId));
  }

  async findById(id: string): Promise<ApiToken | null> {
    const key = CACHE_KEYS.apiTokenById(id);
    return this.cache.getOrSet(key, () => this.inner.findById(id));
  }

  async findByTokenHash(tokenHash: string): Promise<{ token: ApiToken; userEmail: string } | null> {
    const key = CACHE_KEYS.apiTokenByHash(tokenHash);
    return this.cache.getOrSet(key, () => this.inner.findByTokenHash(tokenHash));
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ApiToken | null> {
    return this.inner.findByIdAndUserId(id, userId);
  }

  async create(data: CreateApiTokenData): Promise<ApiToken> {
    const result = await this.inner.create(data);
    await this.cache.delete(CACHE_KEYS.apiTokenList(result.userId));
    return result;
  }

  // Not invalidated: fires on every single validated request, so busting
  // findByTokenHash/findById on every call would defeat the point of caching
  // them at all.
  async updateLastUsed(id: string): Promise<void> {
    await this.inner.updateLastUsed(id);
  }

  async delete(id: string): Promise<void> {
    // Looked up via our own cached findById (Redis-backed in prod) rather
    // than a process-local map, so this stays correct even when the lookup
    // and the delete land on different serverless instances.
    const existing = await this.findById(id);
    await this.inner.delete(id);
    await this.cache.delete(CACHE_KEYS.apiTokenById(id));
    if (existing) {
      await this.cache.delete(CACHE_KEYS.apiTokenByHash(existing.tokenHash));
      await this.cache.delete(CACHE_KEYS.apiTokenList(existing.userId));
    }
  }
}
