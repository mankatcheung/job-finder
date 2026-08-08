import type { ApiToken } from '#src/domain/apiToken/ApiToken.js';
import type {
  IApiTokenRepository,
  CreateApiTokenData,
} from '#src/use-cases/ports/IApiTokenRepository.js';
import type { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { CACHE_KEYS } from '#src/constants.js';

interface Deps {
  drizzleApiTokenRepository: IApiTokenRepository;
  cache: MemoryCache;
}

export class CachedApiTokenRepository implements IApiTokenRepository {
  // Tracks userId/tokenHash per token id so delete() — which only receives an
  // id — can still invalidate the findByTokenHash and per-user list entries.
  // updateLastUsed() deliberately does NOT touch this map or the cache: it
  // fires on every single validated request, so invalidating on it would
  // defeat the point of caching findByTokenHash at all.
  private readonly metaByTokenId = new Map<string, { userId: string; tokenHash: string }>();
  private readonly inner: IApiTokenRepository;
  private readonly cache: MemoryCache;

  constructor({ drizzleApiTokenRepository, cache }: Deps) {
    this.inner = drizzleApiTokenRepository;
    this.cache = cache;
  }

  async findAllByUserId(userId: string): Promise<ApiToken[]> {
    const key = CACHE_KEYS.apiTokenList(userId);
    const hit = this.cache.get<ApiToken[]>(key);
    if (hit) return hit;

    const result = await this.inner.findAllByUserId(userId);
    this.cache.set(key, result);
    for (const token of result) {
      this.metaByTokenId.set(token.id, { userId: token.userId, tokenHash: token.tokenHash });
    }
    return result;
  }

  async findByTokenHash(tokenHash: string): Promise<{ token: ApiToken; userEmail: string } | null> {
    const key = CACHE_KEYS.apiTokenByHash(tokenHash);
    const hit = this.cache.get<{ token: ApiToken; userEmail: string } | null>(key);
    if (hit !== undefined) return hit;

    const result = await this.inner.findByTokenHash(tokenHash);
    this.cache.set(key, result);
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
    this.cache.delete(CACHE_KEYS.apiTokenList(result.userId));
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
      this.cache.delete(CACHE_KEYS.apiTokenByHash(meta.tokenHash));
      this.cache.delete(CACHE_KEYS.apiTokenList(meta.userId));
    }
  }
}
