import { describe, it, expect, vi } from 'vitest';
import { CachedApplicationRepository } from '@/infrastructure/db/repositories/CachedApplicationRepository.js';
import { MemoryCache } from '@/infrastructure/cache/MemoryCache.js';
import { makeApplicationRepository, makeApplication } from '@/__tests__/helpers/mocks.js';

function makeRepo() {
  const inner = makeApplicationRepository();
  const cache = new MemoryCache(60_000);
  const repo = new CachedApplicationRepository({
    prismaApplicationRepository: inner,
    cache,
  });
  return { repo, inner, cache };
}

const app = makeApplication();

describe('CachedApplicationRepository', () => {
  describe('findAllByUserId', () => {
    it('fetches from inner on first call and populates cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([app]);

      const result = await repo.findAllByUserId('user-1');
      expect(result).toEqual([app]);
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call without hitting inner', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([app]);

      await repo.findAllByUserId('user-1');
      const result = await repo.findAllByUserId('user-1');
      expect(result).toEqual([app]);
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();
    });

    it('uses separate cache keys for different users', async () => {
      const { repo, inner } = makeRepo();
      const app2 = makeApplication({ id: 'app-2', userId: 'user-2' });
      vi.mocked(inner.findAllByUserId)
        .mockResolvedValueOnce([app])
        .mockResolvedValueOnce([app2]);

      const r1 = await repo.findAllByUserId('user-1');
      const r2 = await repo.findAllByUserId('user-2');
      expect(r1).toEqual([app]);
      expect(r2).toEqual([app2]);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });

    it('uses separate cache keys for different status filters', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([app]);

      await repo.findAllByUserId('user-1', { status: 'applied' });
      await repo.findAllByUserId('user-1', { status: 'interviewing' });
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('findById', () => {
    it('fetches from inner on first call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(app);

      const result = await repo.findById('app-1');
      expect(result).toEqual(app);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(app);

      await repo.findById('app-1');
      const result = await repo.findById('app-1');
      expect(result).toEqual(app);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('caches null when application is not found', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(null);

      await repo.findById('missing');
      await repo.findById('missing');
      expect(inner.findById).toHaveBeenCalledOnce();
    });
  });

  describe('create', () => {
    it('delegates to inner and invalidates the user list cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([]);
      vi.mocked(inner.create).mockResolvedValue(app);

      // Populate list cache
      await repo.findAllByUserId('user-1');
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();

      // Create should bust the cache
      await repo.create({
        id: 'app-1',
        userId: 'user-1',
        company: 'Acme',
        role: 'SWE',
        status: 'draft',
      });

      // Next list fetch must go to inner again
      vi.mocked(inner.findAllByUserId).mockResolvedValue([app]);
      await repo.findAllByUserId('user-1');
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('delegates to inner, invalidates byId and list caches', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(app);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([app]);
      vi.mocked(inner.update).mockResolvedValue({ ...app, company: 'Updated' });

      // Populate caches
      await repo.findById('app-1');
      await repo.findAllByUserId('user-1');

      await repo.update('app-1', { company: 'Updated' });

      // Both caches must be gone
      vi.mocked(inner.findById).mockResolvedValue({ ...app, company: 'Updated' });
      vi.mocked(inner.findAllByUserId).mockResolvedValue([{ ...app, company: 'Updated' }]);
      await repo.findById('app-1');
      await repo.findAllByUserId('user-1');
      expect(inner.findById).toHaveBeenCalledTimes(2);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('delegates to inner and invalidates caches when userId is known', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(app);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([app]);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      // Populate caches (which also records userId→appId mapping)
      await repo.findById('app-1');
      await repo.findAllByUserId('user-1');

      await repo.delete('app-1');

      // Both caches should be invalidated
      vi.mocked(inner.findById).mockResolvedValue(null);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([]);
      await repo.findById('app-1');
      await repo.findAllByUserId('user-1');
      expect(inner.findById).toHaveBeenCalledTimes(2);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });

    it('still deletes from inner even when userId is unknown', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      await repo.delete('unknown-id');
      expect(inner.delete).toHaveBeenCalledWith('unknown-id');
    });
  });
});
