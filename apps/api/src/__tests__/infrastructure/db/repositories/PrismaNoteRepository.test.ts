import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaNoteRepository } from '@/infrastructure/db/repositories/PrismaNoteRepository.js';
import { createTestDb, type TestDb } from '@/__tests__/helpers/createTestDb.js';

describe('PrismaNoteRepository', () => {
  let db: TestDb;
  let repo: PrismaNoteRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new PrismaNoteRepository({ prisma: db.prisma });
    await db.prisma.user.create({ data: { id: 'u1', email: 'u@t.com', passwordHash: 'h' } });
    await db.prisma.jobApplication.create({
      data: { id: 'app-1', userId: 'u1', company: 'Acme', role: 'Eng', status: 'draft' },
    });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.prisma.note.deleteMany();
  });

  describe('create', () => {
    it('persists a note and returns the entity', async () => {
      const note = await repo.create({ id: 'n1', applicationId: 'app-1', content: 'Good fit.' });

      expect(note.id).toBe('n1');
      expect(note.applicationId).toBe('app-1');
      expect(note.content).toBe('Good fit.');
      expect(note.createdAt).toBeInstanceOf(Date);
      expect(note.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    it('returns the note when it exists', async () => {
      await repo.create({ id: 'n1', applicationId: 'app-1', content: 'Note.' });
      expect((await repo.findById('n1'))?.id).toBe('n1');
    });

    it('returns null when not found', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findAllByApplicationId', () => {
    it('returns all notes for the application ordered newest first', async () => {
      await db.prisma.$executeRawUnsafe(
        `INSERT INTO "Note" (id, applicationId, content, createdAt, updatedAt) VALUES ('n1', 'app-1', 'First', '2024-01-01 00:00:00', '2024-01-01 00:00:00')`,
      );
      await db.prisma.$executeRawUnsafe(
        `INSERT INTO "Note" (id, applicationId, content, createdAt, updatedAt) VALUES ('n2', 'app-1', 'Second', '2024-01-02 00:00:00', '2024-01-02 00:00:00')`,
      );

      const notes = await repo.findAllByApplicationId('app-1');
      expect(notes).toHaveLength(2);
      expect(notes[0].id).toBe('n2');
    });

    it('returns an empty array when there are no notes', async () => {
      expect(await repo.findAllByApplicationId('app-1')).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('updates the content and returns the updated note', async () => {
      await repo.create({ id: 'n1', applicationId: 'app-1', content: 'Original.' });
      const updated = await repo.update('n1', 'Revised.');

      expect(updated.content).toBe('Revised.');
      expect(updated.id).toBe('n1');
    });
  });

  describe('delete', () => {
    it('removes the note', async () => {
      await repo.create({ id: 'n1', applicationId: 'app-1', content: 'Delete me.' });
      await repo.delete('n1');
      expect(await repo.findById('n1')).toBeNull();
    });
  });
});
