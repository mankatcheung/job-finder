import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DrizzleLoginEventRepository } from '#src/infrastructure/db/repositories/DrizzleLoginEventRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, loginEvent } from '#src/infrastructure/db/schema.js';

describe('DrizzleLoginEventRepository', () => {
  let db: TestDb;
  let repo: DrizzleLoginEventRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleLoginEventRepository({ db: db.db });
    await db.db.insert(user).values({ id: 'u1', email: 'u@t.com', passwordHash: 'h' });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.db.delete(loginEvent);
  });

  describe('create', () => {
    it('persists a login event and returns the entity', async () => {
      const event = await repo.create({
        id: 'event-1',
        userId: 'u1',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(event.id).toBe('event-1');
      expect(event.userId).toBe('u1');
      expect(event.ipAddress).toBe('127.0.0.1');
      expect(event.userAgent).toBe('Mozilla/5.0');
      expect(event.createdAt).toBeInstanceOf(Date);
    });

    it('persists null ipAddress/userAgent', async () => {
      const event = await repo.create({
        id: 'event-1',
        userId: 'u1',
        ipAddress: null,
        userAgent: null,
      });

      expect(event.ipAddress).toBeNull();
      expect(event.userAgent).toBeNull();
    });
  });

  describe('findRecentByUserId', () => {
    it('returns events for the user ordered newest first, capped at the limit', async () => {
      await db.db.insert(loginEvent).values({
        id: 'event-1',
        userId: 'u1',
        ipAddress: '1.1.1.1',
        userAgent: 'agent-1',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
      await db.db.insert(loginEvent).values({
        id: 'event-2',
        userId: 'u1',
        ipAddress: '2.2.2.2',
        userAgent: 'agent-2',
        createdAt: new Date('2024-01-02T00:00:00Z'),
      });

      const events = await repo.findRecentByUserId('u1', 1);
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('event-2');
    });

    it('returns an empty array when the user has no login events', async () => {
      expect(await repo.findRecentByUserId('u1', 20)).toHaveLength(0);
    });
  });
});
