import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaDocumentRepository } from '@/infrastructure/db/repositories/PrismaDocumentRepository.js';
import { createTestDb, type TestDb } from '@/__tests__/helpers/createTestDb.js';

const BASE_DOC = {
  id: 'doc-1',
  applicationId: 'app-1',
  name: 'resume.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 12345,
  storageKey: 'users/u1/applications/app-1/resume.pdf',
};

describe('PrismaDocumentRepository', () => {
  let db: TestDb;
  let repo: PrismaDocumentRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new PrismaDocumentRepository({ prisma: db.prisma });
    await db.prisma.user.create({ data: { id: 'u1', email: 'u@t.com', passwordHash: 'h' } });
    await db.prisma.jobApplication.create({
      data: { id: 'app-1', userId: 'u1', company: 'Acme', role: 'Eng', status: 'draft' },
    });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.prisma.document.deleteMany();
  });

  describe('create', () => {
    it('persists a document and returns the entity', async () => {
      const doc = await repo.create(BASE_DOC);

      expect(doc.id).toBe('doc-1');
      expect(doc.applicationId).toBe('app-1');
      expect(doc.name).toBe('resume.pdf');
      expect(doc.mimeType).toBe('application/pdf');
      expect(doc.sizeBytes).toBe(12345);
      expect(doc.storageKey).toBe('users/u1/applications/app-1/resume.pdf');
      expect(doc.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    it('returns the document when it exists', async () => {
      await repo.create(BASE_DOC);
      expect((await repo.findById('doc-1'))?.id).toBe('doc-1');
    });

    it('returns null when not found', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findAllByApplicationId', () => {
    it('returns all documents for the application ordered newest first', async () => {
      await repo.create(BASE_DOC);
      await repo.create({ ...BASE_DOC, id: 'doc-2', storageKey: 'path/to/cover.pdf' });

      const docs = await repo.findAllByApplicationId('app-1');
      expect(docs).toHaveLength(2);
      expect(docs[0].id).toBe('doc-2');
    });

    it('returns an empty array when there are no documents', async () => {
      expect(await repo.findAllByApplicationId('app-1')).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('removes the document', async () => {
      await repo.create(BASE_DOC);
      await repo.delete('doc-1');
      expect(await repo.findById('doc-1')).toBeNull();
    });
  });
});
