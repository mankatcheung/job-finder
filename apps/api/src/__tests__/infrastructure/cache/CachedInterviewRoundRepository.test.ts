import { describe, it, expect, vi } from 'vitest';
import { CachedInterviewRoundRepository } from '#src/infrastructure/db/repositories/CachedInterviewRoundRepository.js';
import { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { makeInterviewRoundRepository, makeInterviewRound } from '#src/__tests__/helpers/mocks.js';

function makeRepo() {
  const inner = makeInterviewRoundRepository();
  const cache = new MemoryCache(60_000);
  const repo = new CachedInterviewRoundRepository({
    drizzleInterviewRoundRepository: inner,
    cache,
  });
  return { repo, inner, cache };
}

const round = makeInterviewRound({ id: 'round-1', applicationId: 'app-1' });

describe('CachedInterviewRoundRepository', () => {
  describe('findAllByApplicationId', () => {
    it('fetches from inner on first call and populates cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([round]);

      const result = await repo.findAllByApplicationId('app-1');
      expect(result).toEqual([round]);
      expect(inner.findAllByApplicationId).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call without hitting inner', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([round]);

      await repo.findAllByApplicationId('app-1');
      const result = await repo.findAllByApplicationId('app-1');
      expect(result).toEqual([round]);
      expect(inner.findAllByApplicationId).toHaveBeenCalledOnce();
    });

    it('uses separate cache keys for different applications', async () => {
      const { repo, inner } = makeRepo();
      const round2 = makeInterviewRound({ id: 'round-2', applicationId: 'app-2' });
      vi.mocked(inner.findAllByApplicationId)
        .mockResolvedValueOnce([round])
        .mockResolvedValueOnce([round2]);

      const r1 = await repo.findAllByApplicationId('app-1');
      const r2 = await repo.findAllByApplicationId('app-2');
      expect(r1).toEqual([round]);
      expect(r2).toEqual([round2]);
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAllByUserId', () => {
    it('delegates straight to inner without caching', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findAllByUserId).mockResolvedValue([round]);

      const r1 = await repo.findAllByUserId('user-1');
      const r2 = await repo.findAllByUserId('user-1');

      expect(r1).toEqual([round]);
      expect(r2).toEqual([round]);
      expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('findById', () => {
    it('fetches from inner on first call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(round);

      const result = await repo.findById('round-1');
      expect(result).toEqual(round);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(round);

      await repo.findById('round-1');
      const result = await repo.findById('round-1');
      expect(result).toEqual(round);
      expect(inner.findById).toHaveBeenCalledOnce();
    });

    it('caches null when the round is not found', async () => {
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
      vi.mocked(inner.create).mockResolvedValue(round);

      await repo.findAllByApplicationId('app-1');
      expect(inner.findAllByApplicationId).toHaveBeenCalledOnce();

      await repo.create({ id: 'round-1', applicationId: 'app-1', type: 'phone' });

      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([round]);
      await repo.findAllByApplicationId('app-1');
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('delegates to inner and invalidates both byId and list caches', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(round);
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([round]);
      vi.mocked(inner.update).mockResolvedValue({ ...round, outcome: 'passed' });

      await repo.findById('round-1');
      await repo.findAllByApplicationId('app-1');

      await repo.update('round-1', { outcome: 'passed' });

      vi.mocked(inner.findById).mockResolvedValue({ ...round, outcome: 'passed' });
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([{ ...round, outcome: 'passed' }]);
      await repo.findById('round-1');
      await repo.findAllByApplicationId('app-1');
      expect(inner.findById).toHaveBeenCalledTimes(2);
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('looks up the round via its own findById, then invalidates byId and list caches', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(round);
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([round]);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      await repo.findAllByApplicationId('app-1');
      await repo.delete('round-1');

      expect(inner.findById).toHaveBeenCalledWith('round-1');
      vi.mocked(inner.findById).mockResolvedValue(null);
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([]);
      await repo.findById('round-1');
      await repo.findAllByApplicationId('app-1');
      expect(inner.findById).toHaveBeenCalledTimes(2);
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });

    it('invalidates the list cache from a second repo instance that never read the round locally (simulates a different serverless instance sharing the same Redis-backed cache)', async () => {
      const inner = makeInterviewRoundRepository();
      const cache = new MemoryCache(60_000);
      const repoA = new CachedInterviewRoundRepository({
        drizzleInterviewRoundRepository: inner,
        cache,
      });
      const repoB = new CachedInterviewRoundRepository({
        drizzleInterviewRoundRepository: inner,
        cache,
      });

      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([round]);
      vi.mocked(inner.findById).mockResolvedValue(round);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      // repoA warms the list cache, as if an earlier request landed on a different instance
      await repoA.findAllByApplicationId('app-1');

      // repoB has no local state whatsoever, yet must still invalidate correctly
      await repoB.delete('round-1');

      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([]);
      await repoA.findAllByApplicationId('app-1');
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });

    it('still deletes from inner even when the round is not found', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(null);
      vi.mocked(inner.delete).mockResolvedValue(undefined);

      await repo.delete('unknown-id');
      expect(inner.delete).toHaveBeenCalledWith('unknown-id');
    });
  });

  describe('updatePushNotificationSentAt', () => {
    it('looks up the round via its own findById, then invalidates byId and list caches', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(round);
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([round]);
      vi.mocked(inner.updatePushNotificationSentAt).mockResolvedValue(undefined);

      await repo.findAllByApplicationId('app-1');
      await repo.updatePushNotificationSentAt('round-1', new Date());

      expect(inner.findById).toHaveBeenCalledWith('round-1');
      const updated = { ...round, pushNotificationSentAt: new Date() };
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([updated]);
      await repo.findAllByApplicationId('app-1');
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });

    it('invalidates the list cache from a second repo instance that never read the round locally (simulates the background push job landing on a different serverless instance than an earlier dashboard read)', async () => {
      const inner = makeInterviewRoundRepository();
      const cache = new MemoryCache(60_000);
      const repoA = new CachedInterviewRoundRepository({
        drizzleInterviewRoundRepository: inner,
        cache,
      });
      const repoB = new CachedInterviewRoundRepository({
        drizzleInterviewRoundRepository: inner,
        cache,
      });

      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([round]);
      vi.mocked(inner.findUpcomingWithinWindow).mockResolvedValue([round]);
      vi.mocked(inner.findById).mockResolvedValue(round);
      vi.mocked(inner.updatePushNotificationSentAt).mockResolvedValue(undefined);

      // repoA warms the list cache (e.g. an earlier dashboard read on a different instance)
      await repoA.findAllByApplicationId('app-1');

      // repoB discovers the upcoming round via the uncached finder and marks it
      // notified, with no local state carried over from repoA
      await repoB.findUpcomingWithinWindow(86_400_000);
      await repoB.updatePushNotificationSentAt(round.id, new Date());

      const updated = { ...round, pushNotificationSentAt: new Date() };
      vi.mocked(inner.findAllByApplicationId).mockResolvedValue([updated]);
      await repoA.findAllByApplicationId('app-1');
      expect(inner.findAllByApplicationId).toHaveBeenCalledTimes(2);
    });

    it('still updates via inner even when the round is not found', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.findById).mockResolvedValue(null);
      vi.mocked(inner.updatePushNotificationSentAt).mockResolvedValue(undefined);

      await repo.updatePushNotificationSentAt('unknown-id', new Date());
      expect(inner.updatePushNotificationSentAt).toHaveBeenCalledWith(
        'unknown-id',
        expect.any(Date),
      );
    });
  });
});
