import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { DrizzleInterviewRoundRepository } from '#src/infrastructure/db/repositories/DrizzleInterviewRoundRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, jobApplication, interviewRound } from '#src/infrastructure/db/schema.js';

describe('DrizzleInterviewRoundRepository', () => {
  let db: TestDb;
  let repo: DrizzleInterviewRoundRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleInterviewRoundRepository({ db: db.db });
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
    await db.db.delete(interviewRound);
  });

  describe('create', () => {
    it('persists a round with explicit fields and returns the entity', async () => {
      const scheduledAt = new Date('2024-06-01T10:00:00.000Z');
      const round = await repo.create({
        id: 'r1',
        applicationId: 'app-1',
        type: 'technical',
        scheduledAt,
        interviewerName: 'Jane Doe',
        outcome: 'pending',
      });

      expect(round.id).toBe('r1');
      expect(round.applicationId).toBe('app-1');
      expect(round.type).toBe('technical');
      expect(round.scheduledAt).toEqual(scheduledAt);
      expect(round.interviewerName).toBe('Jane Doe');
      expect(round.outcome).toBe('pending');
      expect(round.createdAt).toBeInstanceOf(Date);
      expect(round.updatedAt).toBeInstanceOf(Date);
    });

    it('defaults outcome when not provided', async () => {
      const round = await repo.create({ id: 'r1', applicationId: 'app-1', type: 'phone' });
      expect(round.outcome).toBe('pending');
    });
  });

  describe('findById', () => {
    it('returns the round when it exists', async () => {
      await repo.create({ id: 'r1', applicationId: 'app-1', type: 'phone' });
      expect((await repo.findById('r1'))?.id).toBe('r1');
    });

    it('returns null when not found', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findAllByApplicationId', () => {
    it('returns all rounds for the application ordered oldest first', async () => {
      await db.db.insert(interviewRound).values({
        id: 'r1',
        applicationId: 'app-1',
        type: 'phone',
        outcome: 'pending',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
      await db.db.insert(interviewRound).values({
        id: 'r2',
        applicationId: 'app-1',
        type: 'technical',
        outcome: 'pending',
        createdAt: new Date('2024-01-02T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });

      const rounds = await repo.findAllByApplicationId('app-1');
      expect(rounds).toHaveLength(2);
      expect(rounds[0].id).toBe('r1');
      expect(rounds[1].id).toBe('r2');
    });

    it('returns an empty array when there are no rounds', async () => {
      expect(await repo.findAllByApplicationId('app-1')).toHaveLength(0);
    });
  });

  describe('findAllByUserId', () => {
    beforeEach(async () => {
      await db.db.delete(jobApplication).where(eq(jobApplication.id, 'app-2'));
      await db.db.delete(user).where(eq(user.id, 'u2'));
    });

    it('returns rounds across every application owned by the user, not other users', async () => {
      await db.db.insert(user).values({ id: 'u2', email: 'u2@t.com', passwordHash: 'h' });
      await db.db.insert(jobApplication).values({
        id: 'app-2',
        userId: 'u2',
        company: 'Globex',
        role: 'Eng',
        status: 'draft',
      });
      await repo.create({ id: 'r1', applicationId: 'app-1', type: 'phone' });
      await repo.create({ id: 'r2', applicationId: 'app-2', type: 'onsite' });

      const rounds = await repo.findAllByUserId('u1');

      expect(rounds.map((r) => r.id)).toEqual(['r1']);
    });

    it('returns an empty array when the user has no interview rounds', async () => {
      expect(await repo.findAllByUserId('u1')).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('updates only the provided fields', async () => {
      await repo.create({
        id: 'r1',
        applicationId: 'app-1',
        type: 'phone',
        interviewerName: 'Original Name',
      });

      const updated = await repo.update('r1', { outcome: 'passed' });

      expect(updated.outcome).toBe('passed');
      expect(updated.type).toBe('phone');
      expect(updated.interviewerName).toBe('Original Name');
    });

    it('allows clearing a nullable field back to null', async () => {
      await repo.create({
        id: 'r1',
        applicationId: 'app-1',
        type: 'phone',
        interviewerName: 'Jane Doe',
      });

      const updated = await repo.update('r1', { interviewerName: null });

      expect(updated.interviewerName).toBeNull();
    });
  });

  describe('delete', () => {
    it('removes the round', async () => {
      await repo.create({ id: 'r1', applicationId: 'app-1', type: 'phone' });
      await repo.delete('r1');
      expect(await repo.findById('r1')).toBeNull();
    });
  });
});
