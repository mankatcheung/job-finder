import { describe, it, expect, vi } from 'vitest';
import { CachedContactRepository } from '#src/infrastructure/db/repositories/CachedContactRepository.js';
import { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { makeContactRepository, makeContact } from '#src/__tests__/helpers/mocks.js';

function makeRepo() {
  const inner = makeContactRepository();
  const cache = new MemoryCache(60_000);
  const repo = new CachedContactRepository({ drizzleContactRepository: inner, cache });
  return { repo, inner, cache };
}

const contact = makeContact();

describe('CachedContactRepository', () => {
  describe('findAllByApplicationId', () => {
    it('fetches from inner on first call and populates cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([contact]);

      const result = await repo.findAllByApplicationId('app-1');
      expect(result).toEqual([contact]);
      expect(inner.findAllByApplicationId).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call without hitting inner', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([contact]);

      await repo.findAllByApplicationId('app-1');
      const result = await repo.findAllByApplicationId('app-1');
      expect(result).toEqual([contact]);
      expect(inner.findAllByApplicationId).toHaveBeenCalledOnce();
    });

    it('uses separate cache keys for different applications', async () => {
      const { repo, inner } = makeRepo();
      const contact2 = makeContact({ id: 'contact-2', applicationId: 'app-2' });
      vi.mocked(inner.findAllByApplicationId)
        .mockResolvedValueOnce([contact])
        .mockResolvedValueOnce([contact2]);

      const r1 = await repo.findAllByApplicationId('app-1');
      const r2 = await repo.findAllByApplicationId('app-2');
      expect(r1).toEqual([contact]);
      expect(r2).toEqual([contact2]);
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });
  });

  describe('findById', () => {
    it('fetches from inner on first call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(contact);

      const result = await repo.findById('contact-1');
      expect(result).toEqual(contact);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(contact);

      await repo.findById('contact-1');
      const result = await repo.findById('contact-1');
      expect(result).toEqual(contact);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('caches null when contact is not found', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(null);

      await repo.findById('missing');
      await repo.findById('missing');
      expect(inner.findById).toHaveBeenCalledOnce();
    });
  });

  describe('create', () => {
    it('delegates to inner and invalidates the application list cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([]);
      vi.mocked(inner.create).mockResolvedValue(contact);

      await repo.findAllByApplicationId('app-1');
      expect(inner.findAllByApplicationId).toHaveBeenCalledOnce();

      await repo.create({
        id: 'contact-1',
        applicationId: 'app-1',
        name: 'Jane Recruiter',
        role: 'Technical Recruiter',
      });

      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([contact]);
      await repo.findAllByApplicationId('app-1');
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('delegates to inner, invalidates byId and list caches', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(contact);
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([contact]);
      vi.mocked(inner.update).mockResolvedValue({ ...contact, name: 'Updated Name' });

      await repo.findById('contact-1');
      await repo.findAllByApplicationId('app-1');

      await repo.update('contact-1', { name: 'Updated Name' });

      vi.mocked(inner.findById).mockResolvedValue({ ...contact, name: 'Updated Name' });
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([
        { ...contact, name: 'Updated Name' },
      ]);
      await repo.findById('contact-1');
      await repo.findAllByApplicationId('app-1');
      expect(inner.findById).toHaveBeenCalledTimes(2);
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('delegates to inner and invalidates byId and list caches', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(contact);
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([contact]);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      await repo.findById('contact-1');
      await repo.findAllByApplicationId('app-1');

      await repo.delete('contact-1', 'app-1');

      vi.mocked(inner.findById).mockResolvedValue(null);
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([]);
      await repo.findById('contact-1');
      await repo.findAllByApplicationId('app-1');
      expect(inner.findById).toHaveBeenCalledTimes(2);
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });

    it('evicts the list cache from a second repo instance with no prior read on it (JEF-209 — the id→applicationId map this used to depend on is gone)', async () => {
      const inner = makeContactRepository();
      const cache = new MemoryCache(60_000);
      const repoA = new CachedContactRepository({ drizzleContactRepository: inner, cache });
      const repoB = new CachedContactRepository({ drizzleContactRepository: inner, cache });

      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([contact]);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      // repoA warms the list cache; repoB never reads anything before deleting.
      await repoA.findAllByApplicationId('app-1');
      await repoB.delete('contact-1', 'app-1');

      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([]);
      await repoA.findAllByApplicationId('app-1');
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });
  });
});
