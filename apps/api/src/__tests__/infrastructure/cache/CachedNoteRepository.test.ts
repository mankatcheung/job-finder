import { describe, it, expect, vi } from 'vitest';
import { CachedNoteRepository } from '@/infrastructure/db/repositories/CachedNoteRepository.js';
import { MemoryCache } from '@/infrastructure/cache/MemoryCache.js';
import { makeNoteRepository, makeNote } from '@/__tests__/helpers/mocks.js';

function makeRepo() {
  const inner = makeNoteRepository();
  const cache = new MemoryCache(60_000);
  const repo = new CachedNoteRepository({ prismaNoteRepository: inner, cache });
  return { repo, inner, cache };
}

const note = makeNote();

describe('CachedNoteRepository', () => {
  describe('findAllByApplicationId', () => {
    it('fetches from inner on first call and populates cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([note]);

      const result = await repo.findAllByApplicationId('app-1');
      expect(result).toEqual([note]);
      expect(inner.findAllByApplicationId).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call without hitting inner', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([note]);

      await repo.findAllByApplicationId('app-1');
      const result = await repo.findAllByApplicationId('app-1');
      expect(result).toEqual([note]);
      expect(inner.findAllByApplicationId).toHaveBeenCalledOnce();
    });

    it('uses separate cache keys for different applications', async () => {
      const { repo, inner } = makeRepo();
      const note2 = makeNote({ id: 'note-2', applicationId: 'app-2' });
      vi.mocked(inner.findAllByApplicationId)
        .mockResolvedValueOnce([note])
        .mockResolvedValueOnce([note2]);

      const r1 = await repo.findAllByApplicationId('app-1');
      const r2 = await repo.findAllByApplicationId('app-2');
      expect(r1).toEqual([note]);
      expect(r2).toEqual([note2]);
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });
  });

  describe('findById', () => {
    it('fetches from inner on first call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(note);

      const result = await repo.findById('note-1');
      expect(result).toEqual(note);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(note);

      await repo.findById('note-1');
      const result = await repo.findById('note-1');
      expect(result).toEqual(note);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('caches null when note is not found', async () => {
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
      vi.mocked(inner.create).mockResolvedValue(note);

      await repo.findAllByApplicationId('app-1');
      expect(inner.findAllByApplicationId).toHaveBeenCalledOnce();

      await repo.create({ id: 'note-1', applicationId: 'app-1', content: 'Interviewed well.' });

      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([note]);
      await repo.findAllByApplicationId('app-1');
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('delegates to inner, invalidates byId and list caches', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(note);
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([note]);
      vi.mocked(inner.update).mockResolvedValue({ ...note, content: 'Updated' });

      await repo.findById('note-1');
      await repo.findAllByApplicationId('app-1');

      await repo.update('note-1', 'Updated');

      vi.mocked(inner.findById).mockResolvedValue({ ...note, content: 'Updated' });
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([{ ...note, content: 'Updated' }]);
      await repo.findById('note-1');
      await repo.findAllByApplicationId('app-1');
      expect(inner.findById).toHaveBeenCalledTimes(2);
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('delegates to inner and invalidates caches when applicationId is known', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(note);
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([note]);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      // Populate caches (which also records applicationId→noteId mapping)
      await repo.findById('note-1');
      await repo.findAllByApplicationId('app-1');

      await repo.delete('note-1');

      vi.mocked(inner.findById).mockResolvedValue(null);
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([]);
      await repo.findById('note-1');
      await repo.findAllByApplicationId('app-1');
      expect(inner.findById).toHaveBeenCalledTimes(2);
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });

    it('still deletes from inner even when applicationId is unknown', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      await repo.delete('unknown-id');
      expect(inner.delete).toHaveBeenCalledWith('unknown-id');
    });
  });
});
