import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DrizzleContactRepository } from '#src/infrastructure/db/repositories/DrizzleContactRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, jobApplication, contact } from '#src/infrastructure/db/schema.js';

describe('DrizzleContactRepository', () => {
  let db: TestDb;
  let repo: DrizzleContactRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleContactRepository({ db: db.db });
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
    await db.db.delete(contact);
  });

  describe('create', () => {
    it('persists a contact and returns the entity', async () => {
      const c = await repo.create({
        id: 'c1',
        applicationId: 'app-1',
        name: 'Jane Doe',
        role: 'Recruiter',
        email: 'jane@example.com',
      });

      expect(c.id).toBe('c1');
      expect(c.applicationId).toBe('app-1');
      expect(c.name).toBe('Jane Doe');
      expect(c.role).toBe('Recruiter');
      expect(c.email).toBe('jane@example.com');
      expect(c.createdAt).toBeInstanceOf(Date);
      expect(c.updatedAt).toBeInstanceOf(Date);
    });

    it('defaults optional fields to null when omitted', async () => {
      const c = await repo.create({ id: 'c1', applicationId: 'app-1', name: 'Jane Doe' });

      expect(c.role).toBeNull();
      expect(c.email).toBeNull();
      expect(c.phone).toBeNull();
      expect(c.linkedinUrl).toBeNull();
      expect(c.notes).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns the contact when it exists', async () => {
      await repo.create({ id: 'c1', applicationId: 'app-1', name: 'Jane Doe' });
      expect((await repo.findById('c1'))?.id).toBe('c1');
    });

    it('returns null when not found', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findAllByApplicationId', () => {
    it('returns all contacts for the application ordered oldest first', async () => {
      await db.db.insert(contact).values({
        id: 'c1',
        applicationId: 'app-1',
        name: 'First',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
      await db.db.insert(contact).values({
        id: 'c2',
        applicationId: 'app-1',
        name: 'Second',
        createdAt: new Date('2024-01-02T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });

      const contacts = await repo.findAllByApplicationId('app-1');
      expect(contacts).toHaveLength(2);
      expect(contacts[0].id).toBe('c1');
      expect(contacts[1].id).toBe('c2');
    });

    it('returns an empty array when there are no contacts', async () => {
      expect(await repo.findAllByApplicationId('app-1')).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('updates only the provided fields', async () => {
      await repo.create({ id: 'c1', applicationId: 'app-1', name: 'Jane Doe', role: 'Recruiter' });

      const updated = await repo.update('c1', { role: 'Hiring Manager' });

      expect(updated.role).toBe('Hiring Manager');
      expect(updated.name).toBe('Jane Doe');
    });
  });

  describe('delete', () => {
    it('removes the contact', async () => {
      await repo.create({ id: 'c1', applicationId: 'app-1', name: 'Jane Doe' });
      await repo.delete('c1');
      expect(await repo.findById('c1')).toBeNull();
    });
  });
});
