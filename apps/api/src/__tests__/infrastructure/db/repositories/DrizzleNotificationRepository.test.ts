import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { DrizzleNotificationRepository } from '#src/infrastructure/db/repositories/DrizzleNotificationRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, notification } from '#src/infrastructure/db/schema.js';

const BASE_NOTIFICATION = {
  id: 'n-1',
  userId: 'u1',
  type: 'interview_reminder' as const,
  title: 'Upcoming interview: Acme',
  body: 'Phone interview tomorrow at 10am',
  url: '/applications/app-1',
};

describe('DrizzleNotificationRepository', () => {
  let db: TestDb;
  let repo: DrizzleNotificationRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleNotificationRepository({ db: db.db });
    await db.db.insert(user).values([
      { id: 'u1', email: 'user1@test.com', passwordHash: 'hash' },
      { id: 'u2', email: 'user2@test.com', passwordHash: 'hash' },
    ]);
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.db.delete(notification);
  });

  describe('create', () => {
    it('persists a notification, unread by default', async () => {
      const created = await repo.create(BASE_NOTIFICATION);

      expect(created.id).toBe('n-1');
      expect(created.type).toBe('interview_reminder');
      expect(created.title).toBe(BASE_NOTIFICATION.title);
      expect(created.url).toBe('/applications/app-1');
      expect(created.readAt).toBeNull();
      expect(created.createdAt).toBeInstanceOf(Date);
    });

    it('defaults url to null when omitted', async () => {
      const created = await repo.create({ ...BASE_NOTIFICATION, url: undefined });
      expect(created.url).toBeNull();
    });
  });

  describe('findPageByUserId', () => {
    it('paginates through a full result set with no gaps or duplicates, newest first', async () => {
      for (let i = 1; i <= 5; i++) {
        await repo.create({ ...BASE_NOTIFICATION, id: `n-${i}` });
      }

      const seen: string[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < 10; page++) {
        const { items, hasNextPage } = await repo.findPageByUserId('u1', { cursor, limit: 2 });
        seen.push(...items.map((n) => n.id));
        if (!hasNextPage) break;
        cursor = items[items.length - 1].id;
      }

      expect(seen).toEqual(['n-5', 'n-4', 'n-3', 'n-2', 'n-1']);
    });

    it('paginates correctly even when every row shares the same createdAt timestamp', async () => {
      const sameInstant = new Date('2024-01-01T00:00:00.000Z');
      for (let i = 1; i <= 4; i++) {
        await repo.create({ ...BASE_NOTIFICATION, id: `n-${i}` });
        await db.db
          .update(notification)
          .set({ createdAt: sameInstant })
          .where(eq(notification.id, `n-${i}`));
      }

      const page1 = await repo.findPageByUserId('u1', { limit: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.hasNextPage).toBe(true);

      const page2 = await repo.findPageByUserId('u1', { cursor: page1.items[1].id, limit: 2 });
      expect(page2.items).toHaveLength(2);
      expect(page2.hasNextPage).toBe(false);

      const allIds = [...page1.items, ...page2.items].map((n) => n.id).sort();
      expect(allIds).toEqual(['n-1', 'n-2', 'n-3', 'n-4']);
    });

    it('only returns notifications belonging to the given user', async () => {
      await repo.create({ ...BASE_NOTIFICATION, id: 'n-1', userId: 'u1' });
      await repo.create({ ...BASE_NOTIFICATION, id: 'n-2', userId: 'u2' });

      const { items } = await repo.findPageByUserId('u1', { limit: 10 });

      expect(items.map((n) => n.id)).toEqual(['n-1']);
    });
  });

  describe('markManyReadForUser', () => {
    it('marks the given notifications read and returns the number changed', async () => {
      await repo.create({ ...BASE_NOTIFICATION, id: 'n-1' });
      await repo.create({ ...BASE_NOTIFICATION, id: 'n-2' });

      const changed = await repo.markManyReadForUser('u1', ['n-1', 'n-2'], true);

      expect(changed).toBe(2);
      const { items } = await repo.findPageByUserId('u1', { limit: 10 });
      expect(items.every((n) => n.readAt !== null)).toBe(true);
    });

    it('marks read notifications back to unread', async () => {
      await repo.create({ ...BASE_NOTIFICATION, id: 'n-1' });
      await repo.markManyReadForUser('u1', ['n-1'], true);

      const changed = await repo.markManyReadForUser('u1', ['n-1'], false);

      expect(changed).toBe(1);
      const { items } = await repo.findPageByUserId('u1', { limit: 10 });
      expect(items[0].readAt).toBeNull();
    });

    it('does not re-count notifications already in the target state', async () => {
      await repo.create({ ...BASE_NOTIFICATION, id: 'n-1' });
      await repo.markManyReadForUser('u1', ['n-1'], true);

      const changed = await repo.markManyReadForUser('u1', ['n-1'], true);

      expect(changed).toBe(0);
    });

    it("does not affect another user's notifications, even if their id is included", async () => {
      await repo.create({ ...BASE_NOTIFICATION, id: 'n-1', userId: 'u1' });
      await repo.create({ ...BASE_NOTIFICATION, id: 'n-2', userId: 'u2' });

      const changed = await repo.markManyReadForUser('u1', ['n-1', 'n-2'], true);

      expect(changed).toBe(1);
      const { items } = await repo.findPageByUserId('u2', { limit: 10 });
      expect(items[0].readAt).toBeNull();
    });
  });

  describe('countUnreadForUser', () => {
    it('counts only unread notifications for the given user', async () => {
      await repo.create({ ...BASE_NOTIFICATION, id: 'n-1' });
      await repo.create({ ...BASE_NOTIFICATION, id: 'n-2' });
      await repo.create({ ...BASE_NOTIFICATION, id: 'n-3', userId: 'u2' });
      await repo.markManyReadForUser('u1', ['n-1'], true);

      expect(await repo.countUnreadForUser('u1')).toBe(1);
      expect(await repo.countUnreadForUser('u2')).toBe(1);
    });

    it('returns 0 when there are no notifications', async () => {
      expect(await repo.countUnreadForUser('u1')).toBe(0);
    });
  });

  describe('cascade delete', () => {
    it('deletes notifications when the owning user is deleted', async () => {
      await repo.create(BASE_NOTIFICATION);
      await db.db.delete(user).where(eq(user.id, 'u1'));

      const { items } = await repo.findPageByUserId('u1', { limit: 10 });
      expect(items).toHaveLength(0);

      // Restore u1 for subsequent tests in this file.
      await db.db.insert(user).values({ id: 'u1', email: 'user1@test.com', passwordHash: 'hash' });
    });
  });
});
