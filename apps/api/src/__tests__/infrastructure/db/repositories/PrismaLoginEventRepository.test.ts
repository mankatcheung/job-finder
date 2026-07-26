import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaLoginEventRepository } from '#src/infrastructure/db/repositories/PrismaLoginEventRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';

describe('PrismaLoginEventRepository', () => {
  let db: TestDb;
  let repo: PrismaLoginEventRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new PrismaLoginEventRepository({ prisma: db.prisma });
    await db.prisma.user.create({ data: { id: 'u1', email: 'u@t.com', passwordHash: 'h' } });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.prisma.$executeRawUnsafe(`DELETE FROM "LoginEvent"`);
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
      await db.prisma.$executeRawUnsafe(
        `INSERT INTO "LoginEvent" (id, userId, ipAddress, userAgent, createdAt) VALUES ('event-1', 'u1', '1.1.1.1', 'agent-1', '2024-01-01 00:00:00')`,
      );
      await db.prisma.$executeRawUnsafe(
        `INSERT INTO "LoginEvent" (id, userId, ipAddress, userAgent, createdAt) VALUES ('event-2', 'u1', '2.2.2.2', 'agent-2', '2024-01-02 00:00:00')`,
      );

      const events = await repo.findRecentByUserId('u1', 1);
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe('event-2');
    });

    it('returns an empty array when the user has no login events', async () => {
      expect(await repo.findRecentByUserId('u1', 20)).toHaveLength(0);
    });
  });
});
