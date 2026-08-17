import { describe, it, expect, vi } from 'vitest';
import { CachedApiTokenRepository } from '#src/infrastructure/db/repositories/CachedApiTokenRepository.js';
import { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { makeApiTokenRepository, makeApiToken } from '#src/__tests__/helpers/mocks.js';

function makeRepo() {
  const inner = makeApiTokenRepository();
  const cache = new MemoryCache(60_000);
  const repo = new CachedApiTokenRepository({ drizzleApiTokenRepository: inner, cache });
  return { repo, inner, cache };
}

const token = makeApiToken();

describe('CachedApiTokenRepository', () => {
  describe('findAllByUserId', () => {
    it('fetches from inner on first call and populates cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([token]);

      const result = await repo.findAllByUserId('user-1');
      expect(result).toEqual([token]);
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call without hitting inner', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([token]);

      await repo.findAllByUserId('user-1');
      const result = await repo.findAllByUserId('user-1');
      expect(result).toEqual([token]);
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();
    });

    it('uses separate cache keys for different users', async () => {
      const { repo, inner } = makeRepo();
      const token2 = makeApiToken({ id: 'token-2', userId: 'user-2' });
      vi.mocked(inner.findAllByUserId)
        .mockResolvedValueOnce([token])
        .mockResolvedValueOnce([token2]);

      const r1 = await repo.findAllByUserId('user-1');
      const r2 = await repo.findAllByUserId('user-2');
      expect(r1).toEqual([token]);
      expect(r2).toEqual([token2]);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('findByTokenHash', () => {
    it('fetches from inner on first call', async () => {
      const { repo, inner } = makeRepo();
      const entry = { token, userEmail: 'jane@example.com' };
      vi.mocked(inner.findByTokenHash).mockResolvedValue(entry);

      const result = await repo.findByTokenHash('hashed-value');
      expect(result).toEqual(entry);
      expect(inner.findByTokenHash).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call', async () => {
      const { repo, inner } = makeRepo();
      const entry = { token, userEmail: 'jane@example.com' };
      vi.mocked(inner.findByTokenHash).mockResolvedValue(entry);

      await repo.findByTokenHash('hashed-value');
      const result = await repo.findByTokenHash('hashed-value');
      expect(result).toEqual(entry);
      expect(inner.findByTokenHash).toHaveBeenCalledOnce();
    });

    it('caches null when token is not found', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findByTokenHash).mockResolvedValue(null);

      await repo.findByTokenHash('missing');
      await repo.findByTokenHash('missing');
      expect(inner.findByTokenHash).toHaveBeenCalledOnce();
    });
  });

  describe('findById', () => {
    it('fetches from inner on first call and caches on second', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(token);

      const result = await repo.findById('token-1');
      const cached = await repo.findById('token-1');
      expect(result).toEqual(token);
      expect(cached).toEqual(token);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('caches null when the token is not found', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(null);

      await repo.findById('missing');
      await repo.findById('missing');
      expect(inner.findById).toHaveBeenCalledOnce();
    });
  });

  describe('updateLastUsed', () => {
    it('delegates to inner without invalidating the findByTokenHash cache', async () => {
      const { repo, inner } = makeRepo();
      const entry = { token, userEmail: 'jane@example.com' };
      vi.mocked(inner.findByTokenHash).mockResolvedValue(entry);

      await repo.findByTokenHash('hashed-value');
      await repo.updateLastUsed('token-1');
      await repo.findByTokenHash('hashed-value');

      expect(inner.updateLastUsed).toHaveBeenCalledWith('token-1');
      expect(inner.findByTokenHash).toHaveBeenCalledOnce();
    });
  });

  describe('create', () => {
    it('delegates to inner and invalidates the user list cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([]);
      vi.mocked(inner.create).mockResolvedValue(token);

      await repo.findAllByUserId('user-1');
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();

      await repo.create({
        id: 'token-1',
        userId: 'user-1',
        name: 'CLI',
        tokenHash: 'hashed-value',
        scope: 'full',
      });

      vi.mocked(inner.findAllByUserId).mockResolvedValue([token]);
      await repo.findAllByUserId('user-1');
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('looks up the token via its own findById, then invalidates byId, hash, and list caches', async () => {
      const { repo, inner } = makeRepo();
      const entry = { token, userEmail: 'jane@example.com' };
      vi.mocked(inner.findById).mockResolvedValue(token);
      vi.mocked(inner.findByTokenHash).mockResolvedValue(entry);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([token]);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      await repo.findByTokenHash('hashed-value');
      await repo.findAllByUserId('user-1');

      await repo.delete(token.id);

      expect(inner.findById).toHaveBeenCalledWith(token.id);
      vi.mocked(inner.findByTokenHash).mockResolvedValue(null);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([]);
      await repo.findByTokenHash('hashed-value');
      await repo.findAllByUserId('user-1');
      expect(inner.findByTokenHash).toHaveBeenCalledTimes(2);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });

    it('invalidates hash + list caches from a second repo instance that never read the token locally (simulates a different serverless instance sharing the same Redis-backed cache)', async () => {
      const inner = makeApiTokenRepository();
      const cache = new MemoryCache(60_000);
      const repoA = new CachedApiTokenRepository({ drizzleApiTokenRepository: inner, cache });
      const repoB = new CachedApiTokenRepository({ drizzleApiTokenRepository: inner, cache });

      const entry = { token, userEmail: 'jane@example.com' };
      vi.mocked(inner.findByTokenHash).mockResolvedValue(entry);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([token]);
      vi.mocked(inner.findById).mockResolvedValue(token);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      // repoA warms the hash + list caches, as if an earlier request landed on a different instance
      await repoA.findByTokenHash('hashed-value');
      await repoA.findAllByUserId('user-1');

      // repoB has no local state whatsoever, yet must still invalidate correctly
      await repoB.delete(token.id);

      vi.mocked(inner.findByTokenHash).mockResolvedValue(null);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([]);
      await repoA.findByTokenHash('hashed-value');
      await repoA.findAllByUserId('user-1');
      expect(inner.findByTokenHash).toHaveBeenCalledTimes(2);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });

    it('still deletes from inner even when the token is not found', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(null);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      await repo.delete('unknown-id');
      expect(inner.delete).toHaveBeenCalledWith('unknown-id');
    });
  });
});
