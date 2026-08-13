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
  // Tracks userId/tokenHash per token id so delete() — which only receives an
  // id — can still invalidate the findByTokenHash and per-user list entries.
  // updateLastUsed() deliberately does NOT touch this map or the cache: it
  // fires on every single validated request, so invalidating on it would
  // defeat the point of caching findByTokenHash at all.
  private readonly metaByTokenId = new Map<string, { userId: string; tokenHash: string }>();
  private readonly inner: IApiTokenRepository;
  private readonly cache: ICache;

  constructor({ drizzleApiTokenRepository, cache }: Deps) {
    this.inner = drizzleApiTokenRepository;
    this.cache = cache;
  }

  async findAllByUserId(userId: string): Promise<ApiToken[]> {
    const key = CACHE_KEYS.apiTokenList(userId);
    const result = await this.cache.getOrSet(key, () => this.inner.findAllByUserId(userId));
    for (const token of result) {
      this.metaByTokenId.set(token.id, { userId: token.userId, tokenHash: token.tokenHash });
    }
    return result;
  }

  async findByTokenHash(tokenHash: string): Promise<{ token: ApiToken; userEmail: string } | null> {
    const key = CACHE_KEYS.apiTokenByHash(tokenHash);
    const result = await this.cache.getOrSet(key, () => this.inner.findByTokenHash(tokenHash));
    if (result) {
      this.metaByTokenId.set(result.token.id, {
        userId: result.token.userId,
        tokenHash: result.token.tokenHash,
      });
    }
    return result;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<ApiToken | null> {
    return this.inner.findByIdAndUserId(id, userId);
  }

  async create(data: CreateApiTokenData): Promise<ApiToken> {
    const result = await this.inner.create(data);
    this.metaByTokenId.set(result.id, { userId: result.userId, tokenHash: result.tokenHash });
    await this.cache.delete(CACHE_KEYS.apiTokenList(result.userId));
    return result;
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.inner.updateLastUsed(id);
  }

  async delete(id: string): Promise<void> {
    const meta = this.metaByTokenId.get(id);
    await this.inner.delete(id);
    this.metaByTokenId.delete(id);
    if (meta) {
      await this.cache.delete(CACHE_KEYS.apiTokenByHash(meta.tokenHash));
      await this.cache.delete(CACHE_KEYS.apiTokenList(meta.userId));
    }
  }
}
