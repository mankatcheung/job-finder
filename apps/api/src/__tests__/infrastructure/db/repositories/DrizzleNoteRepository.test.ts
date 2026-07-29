import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DrizzleNoteRepository } from '#src/infrastructure/db/repositories/DrizzleNoteRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, jobApplication, note } from '#src/infrastructure/db/schema.js';

describe('DrizzleNoteRepository', () => {
  let db: TestDb;
  let repo: DrizzleNoteRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleNoteRepository({ db: db.db });
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
    await db.db.delete(note);
  });

  describe('create', () => {
    it('persists a note and returns the entity', async () => {
      const n = await repo.create({ id: 'n1', applicationId: 'app-1', content: 'Good fit.' });

      expect(n.id).toBe('n1');
      expect(n.applicationId).toBe('app-1');
      expect(n.content).toBe('Good fit.');
      expect(n.createdAt).toBeInstanceOf(Date);
      expect(n.updatedAt).toBeInstanceOf(Date);
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
      await db.db.insert(note).values({
        id: 'n1',
        applicationId: 'app-1',
        content: 'First',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
      await db.db.insert(note).values({
        id: 'n2',
        applicationId: 'app-1',
        content: 'Second',
        createdAt: new Date('2024-01-02T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });

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
