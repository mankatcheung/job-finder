import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
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

  describe('findRecentByUserExcludingApplication', () => {
    beforeAll(async () => {
      await db.db.insert(user).values({ id: 'u2', email: 'u2@t.com', passwordHash: 'h' });
      await db.db.insert(jobApplication).values([
        { id: 'app-2', userId: 'u1', company: 'Beta', role: 'Eng', status: 'draft' },
        { id: 'app-3', userId: 'u2', company: 'Gamma', role: 'Eng', status: 'draft' },
      ]);
    });

    afterAll(async () => {
      await db.db.delete(jobApplication).where(eq(jobApplication.id, 'app-2'));
      await db.db.delete(jobApplication).where(eq(jobApplication.id, 'app-3'));
      await db.db.delete(user).where(eq(user.id, 'u2'));
    });

    it('excludes notes on the application passed as excludeApplicationId', async () => {
      await repo.create({ id: 'n-app1', applicationId: 'app-1', content: 'On app-1.' });
      await repo.create({ id: 'n-app2', applicationId: 'app-2', content: 'On app-2.' });

      const notes = await repo.findRecentByUserExcludingApplication('u1', 'app-1', 10);

      expect(notes.map((n) => n.id)).toEqual(['n-app2']);
    });

    it("excludes notes belonging to a different user's applications", async () => {
      await repo.create({ id: 'n-app2', applicationId: 'app-2', content: 'Mine.' });
      await repo.create({ id: 'n-app3', applicationId: 'app-3', content: "Someone else's." });

      const notes = await repo.findRecentByUserExcludingApplication('u1', 'app-1', 10);

      expect(notes.map((n) => n.id)).toEqual(['n-app2']);
    });

    it('orders newest first and respects the limit', async () => {
      await repo.create({ id: 'n-app2', applicationId: 'app-2', content: 'Older.' });
      await db.db
        .update(note)
        .set({ createdAt: new Date('2024-01-01T00:00:00Z') })
        .where(eq(note.id, 'n-app2'));
      await repo.create({ id: 'n-app2-b', applicationId: 'app-2', content: 'Newer.' });
      await db.db
        .update(note)
        .set({ createdAt: new Date('2024-06-01T00:00:00Z') })
        .where(eq(note.id, 'n-app2-b'));

      const notes = await repo.findRecentByUserExcludingApplication('u1', 'app-1', 1);

      expect(notes).toHaveLength(1);
      expect(notes[0].id).toBe('n-app2-b');
    });
  });
});
