import { describe, it, expect, vi } from 'vitest';
import { CachedWorkExperienceRepository } from '#src/infrastructure/db/repositories/CachedWorkExperienceRepository.js';
import { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { makeWorkExperienceRepository, makeWorkExperience } from '#src/__tests__/helpers/mocks.js';

function makeRepo() {
  const inner = makeWorkExperienceRepository();
  const cache = new MemoryCache(60_000);
  const repo = new CachedWorkExperienceRepository({
    drizzleWorkExperienceRepository: inner,
    cache,
  });
  return { repo, inner, cache };
}

const experience = makeWorkExperience();

describe('CachedWorkExperienceRepository', () => {
  describe('findAllByUserId', () => {
    it('fetches from inner on first call and populates cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([experience]);

      const result = await repo.findAllByUserId('user-1');
      expect(result).toEqual([experience]);
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call without hitting inner', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([experience]);

      await repo.findAllByUserId('user-1');
      const result = await repo.findAllByUserId('user-1');
      expect(result).toEqual([experience]);
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();
    });

    it('uses separate cache keys for different users', async () => {
      const { repo, inner } = makeRepo();
      const experience2 = makeWorkExperience({ id: 'we-2', userId: 'user-2' });
      vi.mocked(inner.findAllByUserId)
        .mockResolvedValueOnce([experience])
        .mockResolvedValueOnce([experience2]);

      const r1 = await repo.findAllByUserId('user-1');
      const r2 = await repo.findAllByUserId('user-2');
      expect(r1).toEqual([experience]);
      expect(r2).toEqual([experience2]);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('findById', () => {
    it('fetches from inner on first call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(experience);

      const result = await repo.findById('we-1');
      expect(result).toEqual(experience);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(experience);

      await repo.findById('we-1');
      const result = await repo.findById('we-1');
      expect(result).toEqual(experience);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('caches null when work experience entry is not found', async () => {
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
      vi.mocked(inner.create).mockResolvedValue(experience);

      await repo.findAllByUserId('user-1');
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();

      await repo.create({
        id: 'we-1',
        userId: 'user-1',
        company: 'Acme Corp',
        title: 'Software Engineer',
        location: 'San Francisco, CA',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2023-01-01'),
        description: null,
      });

      vi.mocked(inner.findAllByUserId).mockResolvedValue([experience]);
      await repo.findAllByUserId('user-1');
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('delegates to inner, invalidates byId and list caches', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(experience);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([experience]);
      vi.mocked(inner.update).mockResolvedValue({ ...experience, title: 'Staff Engineer' });

      await repo.findById('we-1');
      await repo.findAllByUserId('user-1');

      await repo.update('we-1', { title: 'Staff Engineer' });

      vi.mocked(inner.findById).mockResolvedValue({ ...experience, title: 'Staff Engineer' });
      vi.mocked(inner.findAllByUserId).mockResolvedValue([
        { ...experience, title: 'Staff Engineer' },
      ]);
      await repo.findById('we-1');
      await repo.findAllByUserId('user-1');
      expect(inner.findById).toHaveBeenCalledTimes(2);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('delegates to inner and invalidates byId and list caches', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(experience);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([experience]);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      await repo.findById('we-1');
      await repo.findAllByUserId('user-1');

      await repo.delete('we-1', 'user-1');

      vi.mocked(inner.findById).mockResolvedValue(null);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([]);
      await repo.findById('we-1');
      await repo.findAllByUserId('user-1');
      expect(inner.findById).toHaveBeenCalledTimes(2);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });

    it('evicts the list cache from a second repo instance with no prior read on it (JEF-209 — the id→userId map this used to depend on is gone)', async () => {
      const inner = makeWorkExperienceRepository();
      const cache = new MemoryCache(60_000);
      const repoA = new CachedWorkExperienceRepository({
        drizzleWorkExperienceRepository: inner,
        cache,
      });
      const repoB = new CachedWorkExperienceRepository({
        drizzleWorkExperienceRepository: inner,
        cache,
      });

      vi.mocked(inner.findAllByUserId).mockResolvedValue([experience]);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      // repoA warms the list cache; repoB never reads anything before deleting.
      await repoA.findAllByUserId('user-1');
      await repoB.delete('we-1', 'user-1');

      vi.mocked(inner.findAllByUserId).mockResolvedValue([]);
      await repoA.findAllByUserId('user-1');
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });
});
