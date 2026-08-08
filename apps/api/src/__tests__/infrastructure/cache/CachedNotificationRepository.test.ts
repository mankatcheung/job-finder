import { describe, it, expect, vi } from 'vitest';
import { CachedNotificationRepository } from '#src/infrastructure/db/repositories/CachedNotificationRepository.js';
import { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { makeNotificationRepository, makeNotification } from '#src/__tests__/helpers/mocks.js';

function makeRepo() {
  const inner = makeNotificationRepository();
  const cache = new MemoryCache(60_000);
  const repo = new CachedNotificationRepository({ drizzleNotificationRepository: inner, cache });
  return { repo, inner, cache };
}

describe('CachedNotificationRepository', () => {
  describe('countUnreadForUser', () => {
    it('fetches from inner on first call and populates cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.countUnreadForUser).mockResolvedValue(3);

      const result = await repo.countUnreadForUser('user-1');
      expect(result).toBe(3);
      expect(inner.countUnreadForUser).toHaveBeenCalledOnce();
    });

    it('returns cached result on second call without hitting inner', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.countUnreadForUser).mockResolvedValue(3);

      await repo.countUnreadForUser('user-1');
      const result = await repo.countUnreadForUser('user-1');
      expect(result).toBe(3);
      expect(inner.countUnreadForUser).toHaveBeenCalledOnce();
    });

    it('uses separate cache keys for different users', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.countUnreadForUser).mockResolvedValueOnce(3).mockResolvedValueOnce(7);

      const r1 = await repo.countUnreadForUser('user-1');
      const r2 = await repo.countUnreadForUser('user-2');
      expect(r1).toBe(3);
      expect(r2).toBe(7);
      expect(inner.countUnreadForUser).toHaveBeenCalledTimes(2);
    });

    it('caches a zero count', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.countUnreadForUser).mockResolvedValue(0);

      await repo.countUnreadForUser('user-1');
      await repo.countUnreadForUser('user-1');
      expect(inner.countUnreadForUser).toHaveBeenCalledOnce();
    });
  });

  describe('findPageByUserId', () => {
    it('always passes through to inner without caching', async () => {
      const { repo, inner } = makeRepo();
      const page = { items: [makeNotification()], hasNextPage: false };
      vi.mocked(inner.findPageByUserId).mockResolvedValue(page);

      const r1 = await repo.findPageByUserId('user-1', { limit: 10 });
      const r2 = await repo.findPageByUserId('user-1', { limit: 10 });
      expect(r1).toEqual(page);
      expect(r2).toEqual(page);
      expect(inner.findPageByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('create', () => {
    it('delegates to inner and invalidates the unread count cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.countUnreadForUser).mockResolvedValue(1);
      vi.mocked(inner.create).mockResolvedValue(makeNotification());

      await repo.countUnreadForUser('user-1');
      expect(inner.countUnreadForUser).toHaveBeenCalledOnce();

      await repo.create({
        id: 'notification-1',
        userId: 'user-1',
        type: 'interview_reminder',
        title: 'Upcoming interview: Acme Corp',
        body: 'Software Engineer — phone interview tomorrow at 10:00 AM',
        url: '/applications/app-1',
      });

      vi.mocked(inner.countUnreadForUser).mockResolvedValue(2);
      await repo.countUnreadForUser('user-1');
      expect(inner.countUnreadForUser).toHaveBeenCalledTimes(2);
    });
  });

  describe('markManyReadForUser', () => {
    it('delegates to inner and invalidates the unread count cache', async () => {
      const { repo, inner } = makeRepo();
      vi.mocked(inner.countUnreadForUser).mockResolvedValue(2);
      vi.mocked(inner.markManyReadForUser).mockResolvedValue(2);

      await repo.countUnreadForUser('user-1');
      expect(inner.countUnreadForUser).toHaveBeenCalledOnce();

      const result = await repo.markManyReadForUser('user-1', ['notification-1'], true);
      expect(result).toBe(2);

      vi.mocked(inner.countUnreadForUser).mockResolvedValue(0);
      await repo.countUnreadForUser('user-1');
      expect(inner.countUnreadForUser).toHaveBeenCalledTimes(2);
    });
  });
});
