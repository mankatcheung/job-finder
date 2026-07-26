import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaInterviewRoundRepository } from '#src/infrastructure/db/repositories/PrismaInterviewRoundRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';

describe('PrismaInterviewRoundRepository', () => {
  let db: TestDb;
  let repo: PrismaInterviewRoundRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new PrismaInterviewRoundRepository({ prisma: db.prisma });
    await db.prisma.user.create({ data: { id: 'u1', email: 'u@t.com', passwordHash: 'h' } });
    await db.prisma.jobApplication.create({
      data: { id: 'app-1', userId: 'u1', company: 'Acme', role: 'Eng', status: 'draft' },
    });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.prisma.interviewRound.deleteMany();
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
      await db.prisma.$executeRawUnsafe(
        `INSERT INTO "InterviewRound" (id, applicationId, type, outcome, createdAt, updatedAt) VALUES ('r1', 'app-1', 'phone', 'pending', '2024-01-01 00:00:00', '2024-01-01 00:00:00')`,
      );
      await db.prisma.$executeRawUnsafe(
        `INSERT INTO "InterviewRound" (id, applicationId, type, outcome, createdAt, updatedAt) VALUES ('r2', 'app-1', 'technical', 'pending', '2024-01-02 00:00:00', '2024-01-02 00:00:00')`,
      );

      const rounds = await repo.findAllByApplicationId('app-1');
      expect(rounds).toHaveLength(2);
      expect(rounds[0].id).toBe('r1');
      expect(rounds[1].id).toBe('r2');
    });

    it('returns an empty array when there are no rounds', async () => {
      expect(await repo.findAllByApplicationId('app-1')).toHaveLength(0);
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
