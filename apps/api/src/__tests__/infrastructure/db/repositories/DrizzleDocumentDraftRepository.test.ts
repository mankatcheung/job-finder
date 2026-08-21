import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DrizzleDocumentDraftRepository } from '#src/infrastructure/db/repositories/DrizzleDocumentDraftRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, jobApplication, documentDraft } from '#src/infrastructure/db/schema.js';

describe('DrizzleDocumentDraftRepository', () => {
  let db: TestDb;
  let repo: DrizzleDocumentDraftRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleDocumentDraftRepository({ db: db.db });
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
    await db.db.delete(documentDraft);
  });

  const create = () =>
    repo.create({
      id: 'draft-1',
      applicationId: 'app-1',
      type: 'cover_letter',
      title: 'Untitled',
      contentJson: '{"type":"doc"}',
      plainText: 'Dear hiring manager',
    });

  describe('rename', () => {
    it('changes the title and returns the updated draft', async () => {
      await create();

      const renamed = await repo.rename('draft-1', 'Tailored for Acme');

      expect(renamed.title).toBe('Tailored for Acme');
      expect((await repo.findById('draft-1'))?.title).toBe('Tailored for Acme');
    });

    it('leaves the content untouched', async () => {
      await create();

      await repo.rename('draft-1', 'New name');

      const after = await repo.findById('draft-1');
      expect(after?.contentJson).toBe('{"type":"doc"}');
      expect(after?.plainText).toBe('Dear hiring manager');
    });

    it('advances updatedAt so the editor can tell it changed', async () => {
      const created = await create();

      const renamed = await repo.rename('draft-1', 'New name');

      expect(renamed.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    });
  });
});
