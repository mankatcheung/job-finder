import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CachedMcpOAuthTokenRepository } from '#src/infrastructure/db/repositories/CachedMcpOAuthTokenRepository.js';
import { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import type { IMcpOAuthTokenRepository } from '#src/use-cases/ports/IMcpOAuthTokenRepository.js';
import { CACHE_KEYS } from '#src/infrastructure/config/constants.js';

const HASH = 'hash-1';
const token = {
  id: 'token-1',
  userId: 'user-1',
  clientId: 'client-1',
  familyId: 'grant-1',
  tokenHash: HASH,
  scope: 'read' as const,
  audience: '/mcp',
  expiresAt: new Date('2099-01-01T00:00:00.000Z'),
  revokedAt: null,
  lastUsedAt: null,
  createdAt: new Date('2026-08-20T00:00:00.000Z'),
};

describe('CachedMcpOAuthTokenRepository', () => {
  let cache: MemoryCache;
  let inner: IMcpOAuthTokenRepository;
  let repository: CachedMcpOAuthTokenRepository;

  beforeEach(() => {
    cache = new MemoryCache();
    inner = {
      create: vi.fn(),
      findByTokenHash: vi.fn().mockResolvedValue(token),
      updateLastUsed: vi.fn().mockResolvedValue(undefined),
      revoke: vi.fn().mockResolvedValue(undefined),
      revokeFamily: vi.fn().mockResolvedValue([HASH]),
    };
    repository = new CachedMcpOAuthTokenRepository({
      drizzleMcpOAuthTokenRepository: inner,
      cache,
    });
  });

  it('hits the database once for repeated lookups of the same token', async () => {
    await repository.findByTokenHash(HASH);
    await repository.findByTokenHash(HASH);
    await repository.findByTokenHash(HASH);

    // The point of the change: an MCP client making many tool calls used to
    // pay a Turso read on each one.
    expect(inner.findByTokenHash).toHaveBeenCalledTimes(1);
  });

  it('drops the cached row when its grant is revoked', async () => {
    await repository.findByTokenHash(HASH);

    await repository.revokeFamily('grant-1', new Date());

    // Without this, a request arriving a second later is served the row as it
    // was before — still saying revokedAt: null — and the token keeps working
    // until the entry expires. That turns a caching change into a way to
    // bypass revocation.
    await repository.findByTokenHash(HASH);
    expect(inner.findByTokenHash).toHaveBeenCalledTimes(2);
  });

  it('drops every token in the family, not just the one it was asked about', async () => {
    inner.revokeFamily = vi.fn().mockResolvedValue(['hash-a', 'hash-b', 'hash-c']);
    const deleted = vi.spyOn(cache, 'delete');

    await repository.revokeFamily('grant-1', new Date());

    expect(deleted.mock.calls.map(([key]) => key)).toEqual([
      CACHE_KEYS.mcpOAuthTokenByHash('hash-a'),
      CACHE_KEYS.mcpOAuthTokenByHash('hash-b'),
      CACHE_KEYS.mcpOAuthTokenByHash('hash-c'),
    ]);
  });

  it('invalidates exactly what the write says it revoked', async () => {
    // A grant id says nothing about which cache keys to drop, so the hashes
    // come back from the write itself rather than from a second query that
    // could disagree with it.
    inner.revokeFamily = vi.fn().mockResolvedValue([]);
    const deleted = vi.spyOn(cache, 'delete');

    await repository.revokeFamily('already-revoked-grant', new Date());

    expect(deleted).not.toHaveBeenCalled();
  });

  it('writes lastUsedAt once per window, however many requests arrive', async () => {
    await repository.updateLastUsed('token-1');
    await repository.updateLastUsed('token-1');
    await repository.updateLastUsed('token-1');

    expect(inner.updateLastUsed).toHaveBeenCalledTimes(1);
  });

  it('throttles lastUsedAt per token, not globally', async () => {
    await repository.updateLastUsed('token-1');
    await repository.updateLastUsed('token-2');

    expect(inner.updateLastUsed).toHaveBeenCalledTimes(2);
  });

  it('still serves a revoked or expired row correctly from cache', async () => {
    // Caching a bearer credential is only safe because the row carries its own
    // revokedAt/expiresAt and the validator checks them — so what comes back
    // from cache is exactly what would come back from the database.
    const revoked = { ...token, revokedAt: new Date('2026-08-20T00:00:00.000Z') };
    inner.findByTokenHash = vi.fn().mockResolvedValue(revoked);

    await repository.findByTokenHash(HASH);
    const second = await repository.findByTokenHash(HASH);

    expect(second?.revokedAt).toEqual(revoked.revokedAt);
  });
});
