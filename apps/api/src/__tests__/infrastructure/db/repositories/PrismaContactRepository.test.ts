import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaContactRepository } from '#src/infrastructure/db/repositories/PrismaContactRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';

describe('PrismaContactRepository', () => {
  let db: TestDb;
  let repo: PrismaContactRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new PrismaContactRepository({ prisma: db.prisma });
    await db.prisma.user.create({ data: { id: 'u1', email: 'u@t.com', passwordHash: 'h' } });
    await db.prisma.jobApplication.create({
      data: { id: 'app-1', userId: 'u1', company: 'Acme', role: 'Eng', status: 'draft' },
    });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.prisma.contact.deleteMany();
  });

  describe('create', () => {
    it('persists a contact and returns the entity', async () => {
      const contact = await repo.create({
        id: 'c1',
        applicationId: 'app-1',
        name: 'Jane Doe',
        role: 'Recruiter',
        email: 'jane@example.com',
      });

      expect(contact.id).toBe('c1');
      expect(contact.applicationId).toBe('app-1');
      expect(contact.name).toBe('Jane Doe');
      expect(contact.role).toBe('Recruiter');
      expect(contact.email).toBe('jane@example.com');
      expect(contact.createdAt).toBeInstanceOf(Date);
      expect(contact.updatedAt).toBeInstanceOf(Date);
    });

    it('defaults optional fields to null when omitted', async () => {
      const contact = await repo.create({ id: 'c1', applicationId: 'app-1', name: 'Jane Doe' });

      expect(contact.role).toBeNull();
      expect(contact.email).toBeNull();
      expect(contact.phone).toBeNull();
      expect(contact.linkedinUrl).toBeNull();
      expect(contact.notes).toBeNull();
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
      await db.prisma.$executeRawUnsafe(
        `INSERT INTO "Contact" (id, applicationId, name, createdAt, updatedAt) VALUES ('c1', 'app-1', 'First', '2024-01-01 00:00:00', '2024-01-01 00:00:00')`,
      );
      await db.prisma.$executeRawUnsafe(
        `INSERT INTO "Contact" (id, applicationId, name, createdAt, updatedAt) VALUES ('c2', 'app-1', 'Second', '2024-01-02 00:00:00', '2024-01-02 00:00:00')`,
      );

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
