import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DrizzleActivityLogRepository } from '#src/infrastructure/db/repositories/DrizzleActivityLogRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, jobApplication, activityLog } from '#src/infrastructure/db/schema.js';

describe('DrizzleActivityLogRepository', () => {
  let db: TestDb;
  let repo: DrizzleActivityLogRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleActivityLogRepository({ db: db.db });
    await db.db.insert(user).values({ id: 'u1', email: 'u@t.com', passwordHash: 'h' });
    await db.db.insert(jobApplication).values({
      id: 'app-1',
      userId: 'u1',
      company: 'Acme',
      role: 'Eng',
      status: 'draft',
    });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.db.delete(activityLog);
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
      await db.db.insert(activityLog).values({
        id: 'log-1',
        applicationId: 'app-1',
        actorId: 'u1',
        eventType: 'note_added',
        payload: '{}',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
      await db.db.insert(activityLog).values({
        id: 'log-2',
        applicationId: 'app-1',
        actorId: 'u1',
        eventType: 'status_changed',
        payload: '{}',
        createdAt: new Date('2024-01-02T00:00:00Z'),
      });

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
