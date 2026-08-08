import { describe, it, expect, vi } from 'vitest';
import { CachedEducationRepository } from '#src/infrastructure/db/repositories/CachedEducationRepository.js';
import { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { makeEducationRepository, makeEducation } from '#src/__tests__/helpers/mocks.js';

function makeRepo() {
  const inner = makeEducationRepository();
  const cache = new MemoryCache(60_000);
  const repo = new CachedEducationRepository({ drizzleEducationRepository: inner, cache });
  return { repo, inner, cache };
}

const education = makeEducation();

describe('CachedEducationRepository', () => {
  describe('findAllByUserId', () => {
    it('fetches from inner on first call and populates cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([education]);

      const result = await repo.findAllByUserId('user-1');
      expect(result).toEqual([education]);
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call without hitting inner', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([education]);

      await repo.findAllByUserId('user-1');
      const result = await repo.findAllByUserId('user-1');
      expect(result).toEqual([education]);
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();
    });

    it('uses separate cache keys for different users', async () => {
      const { repo, inner } = makeRepo();
      const education2 = makeEducation({ id: 'edu-2', userId: 'user-2' });
      vi.mocked(inner.findAllByUserId)
        .mockResolvedValueOnce([education])
        .mockResolvedValueOnce([education2]);

      const r1 = await repo.findAllByUserId('user-1');
      const r2 = await repo.findAllByUserId('user-2');
      expect(r1).toEqual([education]);
      expect(r2).toEqual([education2]);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('findById', () => {
    it('fetches from inner on first call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(education);

      const result = await repo.findById('edu-1');
      expect(result).toEqual(education);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(education);

      await repo.findById('edu-1');
      const result = await repo.findById('edu-1');
      expect(result).toEqual(education);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('caches null when education entry is not found', async () => {
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
      vi.mocked(inner.create).mockResolvedValue(education);

      await repo.findAllByUserId('user-1');
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();

      await repo.create({
        id: 'edu-1',
        userId: 'user-1',
        institution: 'UC Berkeley',
        degree: 'B.S.',
        field: 'Computer Science',
        startDate: new Date('2016-09-01'),
        endDate: new Date('2020-05-15'),
        description: null,
      });

      vi.mocked(inner.findAllByUserId).mockResolvedValue([education]);
      await repo.findAllByUserId('user-1');
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('delegates to inner, invalidates byId and list caches', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(education);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([education]);
      vi.mocked(inner.update).mockResolvedValue({ ...education, degree: 'M.S.' });

      await repo.findById('edu-1');
      await repo.findAllByUserId('user-1');

      await repo.update('edu-1', { degree: 'M.S.' });

      vi.mocked(inner.findById).mockResolvedValue({ ...education, degree: 'M.S.' });
      vi.mocked(inner.findAllByUserId).mockResolvedValue([{ ...education, degree: 'M.S.' }]);
      await repo.findById('edu-1');
      await repo.findAllByUserId('user-1');
      expect(inner.findById).toHaveBeenCalledTimes(2);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('delegates to inner and invalidates caches when userId is known', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(education);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([education]);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      // Populate caches (which also records userId→educationId mapping)
      await repo.findById('edu-1');
      await repo.findAllByUserId('user-1');

      await repo.delete('edu-1');

      vi.mocked(inner.findById).mockResolvedValue(null);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([]);
      await repo.findById('edu-1');
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
