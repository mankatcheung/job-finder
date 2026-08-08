import { describe, it, expect, vi } from 'vitest';
import { CachedSkillRepository } from '#src/infrastructure/db/repositories/CachedSkillRepository.js';
import { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { makeSkillRepository, makeSkill } from '#src/__tests__/helpers/mocks.js';

function makeRepo() {
  const inner = makeSkillRepository();
  const cache = new MemoryCache(60_000);
  const repo = new CachedSkillRepository({ drizzleSkillRepository: inner, cache });
  return { repo, inner, cache };
}

const skill = makeSkill();

describe('CachedSkillRepository', () => {
  describe('findAllByUserId', () => {
    it('fetches from inner on first call and populates cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([skill]);

      const result = await repo.findAllByUserId('user-1');
      expect(result).toEqual([skill]);
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call without hitting inner', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([skill]);

      await repo.findAllByUserId('user-1');
      const result = await repo.findAllByUserId('user-1');
      expect(result).toEqual([skill]);
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();
    });

    it('uses separate cache keys for different users', async () => {
      const { repo, inner } = makeRepo();
      const skill2 = makeSkill({ id: 'skill-2', userId: 'user-2' });
      vi.mocked(inner.findAllByUserId)
        .mockResolvedValueOnce([skill])
        .mockResolvedValueOnce([skill2]);

      const r1 = await repo.findAllByUserId('user-1');
      const r2 = await repo.findAllByUserId('user-2');
      expect(r1).toEqual([skill]);
      expect(r2).toEqual([skill2]);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('findById', () => {
    it('fetches from inner on first call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(skill);

      const result = await repo.findById('skill-1');
      expect(result).toEqual(skill);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(skill);

      await repo.findById('skill-1');
      const result = await repo.findById('skill-1');
      expect(result).toEqual(skill);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('caches null when skill is not found', async () => {
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
      vi.mocked(inner.create).mockResolvedValue(skill);

      await repo.findAllByUserId('user-1');
      expect(inner.findAllByUserId).toHaveBeenCalledOnce();

      await repo.create({
        id: 'skill-1',
        userId: 'user-1',
        name: 'TypeScript',
        category: 'Language',
        proficiency: 'expert',
      });

      vi.mocked(inner.findAllByUserId).mockResolvedValue([skill]);
      await repo.findAllByUserId('user-1');
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('delegates to inner, invalidates byId and list caches', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(skill);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([skill]);
      vi.mocked(inner.update).mockResolvedValue({ ...skill, proficiency: 'advanced' });

      await repo.findById('skill-1');
      await repo.findAllByUserId('user-1');

      await repo.update('skill-1', { proficiency: 'advanced' });

      vi.mocked(inner.findById).mockResolvedValue({ ...skill, proficiency: 'advanced' });
      vi.mocked(inner.findAllByUserId).mockResolvedValue([{ ...skill, proficiency: 'advanced' }]);
      await repo.findById('skill-1');
      await repo.findAllByUserId('user-1');
      expect(inner.findById).toHaveBeenCalledTimes(2);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('delegates to inner and invalidates caches when userId is known', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(skill);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([skill]);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      // Populate caches (which also records userId→skillId mapping)
      await repo.findById('skill-1');
      await repo.findAllByUserId('user-1');

      await repo.delete('skill-1');

      vi.mocked(inner.findById).mockResolvedValue(null);
      vi.mocked(inner.findAllByUserId).mockResolvedValue([]);
      await repo.findById('skill-1');
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
