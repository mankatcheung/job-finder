import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaActivityLogRepository } from '#src/infrastructure/db/repositories/PrismaActivityLogRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';

describe('PrismaActivityLogRepository', () => {
  let db: TestDb;
  let repo: PrismaActivityLogRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new PrismaActivityLogRepository({ prisma: db.prisma });
    await db.prisma.user.create({ data: { id: 'u1', email: 'u@t.com', passwordHash: 'h' } });
    await db.prisma.jobApplication.create({
      data: { id: 'app-1', userId: 'u1', company: 'Acme', role: 'Eng', status: 'draft' },
    });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.prisma.$executeRawUnsafe(`DELETE FROM "ActivityLog"`);
  });

  describe('append', () => {
    it('persists a log entry and returns the entity', async () => {
      const log = await repo.append({
        id: 'log-1',
        applicationId: 'app-1',
        actorId: 'u1',
        eventType: 'note_added',
        payload: JSON.stringify({ noteId: 'note-1' }),
      });

      expect(log.id).toBe('log-1');
      expect(log.applicationId).toBe('app-1');
      expect(log.actorId).toBe('u1');
      expect(log.eventType).toBe('note_added');
      expect(log.payload).toBe(JSON.stringify({ noteId: 'note-1' }));
      expect(log.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('findAllByApplicationId', () => {
    it('returns all logs for the application ordered newest first', async () => {
      await db.prisma.$executeRawUnsafe(
        `INSERT INTO "ActivityLog" (id, applicationId, actorId, eventType, payload, createdAt) VALUES ('log-1', 'app-1', 'u1', 'note_added', '{}', '2024-01-01 00:00:00')`,
      );
      await db.prisma.$executeRawUnsafe(
        `INSERT INTO "ActivityLog" (id, applicationId, actorId, eventType, payload, createdAt) VALUES ('log-2', 'app-1', 'u1', 'status_changed', '{}', '2024-01-02 00:00:00')`,
      );

      const logs = await repo.findAllByApplicationId('app-1');
      expect(logs).toHaveLength(2);
      expect(logs[0].id).toBe('log-2');
      expect(logs[1].id).toBe('log-1');
    });

    it('returns an empty array when there are no logs', async () => {
      expect(await repo.findAllByApplicationId('app-1')).toHaveLength(0);
    });
  });
});
