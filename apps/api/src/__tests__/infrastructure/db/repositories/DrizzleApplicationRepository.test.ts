import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { DrizzleApplicationRepository } from '#src/infrastructure/db/repositories/DrizzleApplicationRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, jobApplication } from '#src/infrastructure/db/schema.js';

const BASE_APP = {
  id: 'app-1',
  userId: 'u1',
  company: 'Acme',
  role: 'Engineer',
  status: 'draft' as const,
  jobUrl: null,
  location: null,
  salaryRange: null,
  description: null,
};

describe('DrizzleApplicationRepository', () => {
  let db: TestDb;
  let repo: DrizzleApplicationRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleApplicationRepository({ db: db.db });
    await db.db.insert(user).values({ id: 'u1', email: 'user@test.com', passwordHash: 'hash' });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.db.delete(jobApplication);
  });

  describe('create', () => {
    it('persists an application and returns the entity', async () => {
      const app = await repo.create(BASE_APP);

      expect(app.id).toBe('app-1');
      expect(app.userId).toBe('u1');
      expect(app.company).toBe('Acme');
      expect(app.role).toBe('Engineer');
      expect(app.status).toBe('draft');
      expect(app.jobUrl).toBeNull();
      expect(app.appliedAt).toBeNull();
      expect(app.createdAt).toBeInstanceOf(Date);
      expect(app.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    it('returns the application when it exists', async () => {
      await repo.create(BASE_APP);
      const found = await repo.findById('app-1');
      expect(found?.id).toBe('app-1');
    });

    it('returns null when it does not exist', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findAllByUserId', () => {
    beforeEach(async () => {
      await repo.create({ ...BASE_APP, id: 'app-1', status: 'draft' });
      await repo.create({ ...BASE_APP, id: 'app-2', status: 'applied' });
      await repo.create({ ...BASE_APP, id: 'app-3', status: 'applied' });
    });

    it('returns all applications for the user when no filter is given', async () => {
      const apps = await repo.findAllByUserId('u1');
      expect(apps).toHaveLength(3);
    });

    it('filters by status', async () => {
      const apps = await repo.findAllByUserId('u1', { status: 'applied' });
      expect(apps).toHaveLength(2);
      expect(apps.every((a) => a.status === 'applied')).toBe(true);
    });

    it('returns an empty array when the user has no applications', async () => {
      const apps = await repo.findAllByUserId('other-user');
      expect(apps).toHaveLength(0);
    });

    it('orders results newest first', async () => {
      const apps = await repo.findAllByUserId('u1');
      expect(apps[0].id).toBe('app-3');
      expect(apps[2].id).toBe('app-1');
    });
  });

  describe('findPageByUserId', () => {
    it('paginates through a full result set with no gaps or duplicates, newest first', async () => {
      for (let i = 1; i <= 5; i++) {
        await repo.create({ ...BASE_APP, id: `app-${i}` });
      }

      const seen: string[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < 10; page++) {
        const { items, hasNextPage } = await repo.findPageByUserId('u1', {}, { cursor, limit: 2 });
        seen.push(...items.map((a) => a.id));
        if (!hasNextPage) break;
        cursor = items[items.length - 1].id;
      }

      expect(seen).toEqual(['app-5', 'app-4', 'app-3', 'app-2', 'app-1']);
    });

    it('reports hasNextPage correctly on the last page', async () => {
      await repo.create({ ...BASE_APP, id: 'app-1' });
      await repo.create({ ...BASE_APP, id: 'app-2' });

      const page1 = await repo.findPageByUserId('u1', {}, { limit: 2 });
      expect(page1.items.map((a) => a.id)).toEqual(['app-2', 'app-1']);
      expect(page1.hasNextPage).toBe(false);
    });

    it('paginates correctly even when every row shares the same createdAt timestamp', async () => {
      const sameInstant = new Date('2024-01-01T00:00:00.000Z');
      for (let i = 1; i <= 4; i++) {
        await repo.create({ ...BASE_APP, id: `app-${i}` });
        await db.db
          .update(jobApplication)
          .set({ createdAt: sameInstant })
          .where(eq(jobApplication.id, `app-${i}`));
      }

      const page1 = await repo.findPageByUserId('u1', {}, { limit: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.hasNextPage).toBe(true);

      const page2 = await repo.findPageByUserId('u1', {}, { cursor: page1.items[1].id, limit: 2 });
      expect(page2.items).toHaveLength(2);
      expect(page2.hasNextPage).toBe(false);

      const allIds = [...page1.items, ...page2.items].map((a) => a.id).sort();
      expect(allIds).toEqual(['app-1', 'app-2', 'app-3', 'app-4']);
    });

    it('filters by status', async () => {
      await repo.create({ ...BASE_APP, id: 'app-1', status: 'draft' });
      await repo.create({ ...BASE_APP, id: 'app-2', status: 'applied' });

      const { items } = await repo.findPageByUserId('u1', { status: 'applied' }, { limit: 10 });
      expect(items.map((a) => a.id)).toEqual(['app-2']);
    });

    it('filters by starred', async () => {
      await repo.create({ ...BASE_APP, id: 'app-1', starred: true });
      await repo.create({ ...BASE_APP, id: 'app-2', starred: false });

      const { items } = await repo.findPageByUserId('u1', { starred: true }, { limit: 10 });
      expect(items.map((a) => a.id)).toEqual(['app-1']);
    });

    it('filters by a case-insensitive search across company, role, location, and description', async () => {
      await repo.create({ ...BASE_APP, id: 'app-1', company: 'Stripe', role: 'Engineer' });
      await repo.create({
        ...BASE_APP,
        id: 'app-2',
        company: 'Vercel',
        role: 'stripe-integrations',
      });
      await repo.create({ ...BASE_APP, id: 'app-3', company: 'Anthropic', role: 'Researcher' });

      const { items } = await repo.findPageByUserId('u1', { search: 'STRIPE' }, { limit: 10 });
      expect(items.map((a) => a.id).sort()).toEqual(['app-1', 'app-2']);
    });

    it('scopes results to the given user', async () => {
      await db.db.insert(user).values({ id: 'u2', email: 'other@test.com', passwordHash: 'hash' });
      await repo.create({ ...BASE_APP, id: 'app-1', userId: 'u1' });
      await repo.create({ ...BASE_APP, id: 'app-2', userId: 'u2' });

      const { items } = await repo.findPageByUserId('u1', {}, { limit: 10 });
      expect(items.map((a) => a.id)).toEqual(['app-1']);
    });
  });

  describe('update', () => {
    it('updates only the provided fields', async () => {
      await repo.create(BASE_APP);
      const updated = await repo.update('app-1', { role: 'Staff Engineer' });

      expect(updated.role).toBe('Staff Engineer');
      expect(updated.company).toBe('Acme');
    });

    it('sets appliedAt when provided', async () => {
      await repo.create(BASE_APP);
      const appliedAt = new Date('2024-06-01T10:00:00Z');
      const updated = await repo.update('app-1', { status: 'applied', appliedAt });

      expect(updated.status).toBe('applied');
      expect(updated.appliedAt?.toISOString()).toBe(appliedAt.toISOString());
    });

    it('can set nullable fields to null', async () => {
      await repo.create({ ...BASE_APP, jobUrl: 'https://example.com' });
      const updated = await repo.update('app-1', { jobUrl: null });
      expect(updated.jobUrl).toBeNull();
    });
  });

  describe('delete', () => {
    it('removes the application', async () => {
      await repo.create(BASE_APP);
      await repo.delete('app-1');
      expect(await repo.findById('app-1')).toBeNull();
    });
  });

  describe('tags', () => {
    it('creates an application with tags', async () => {
      const app = await repo.create({ ...BASE_APP, tags: ['frontend', 'remote'] });
      expect(app.tags).toEqual(expect.arrayContaining(['frontend', 'remote']));
    });

    it('replaces tags on update', async () => {
      await repo.create({ ...BASE_APP, tags: ['frontend'] });
      const updated = await repo.update('app-1', { tags: ['backend', 'fulltime'] });
      expect(updated.tags).toEqual(expect.arrayContaining(['backend', 'fulltime']));
      expect(updated.tags).not.toContain('frontend');
    });

    it('returns empty tags array when no tags set', async () => {
      const app = await repo.create(BASE_APP);
      expect(app.tags).toEqual([]);
    });
  });
});
