import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaApplicationRepository } from '@/infrastructure/db/repositories/PrismaApplicationRepository.js';
import { createTestDb, type TestDb } from '@/__tests__/helpers/createTestDb.js';

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

describe('PrismaApplicationRepository', () => {
  let db: TestDb;
  let repo: PrismaApplicationRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new PrismaApplicationRepository({ prisma: db.prisma });
    await db.prisma.user.create({
      data: { id: 'u1', email: 'user@test.com', passwordHash: 'hash' },
    });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.prisma.jobApplication.deleteMany();
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
