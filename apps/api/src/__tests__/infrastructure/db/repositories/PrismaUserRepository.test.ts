import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaUserRepository } from '@/infrastructure/db/repositories/PrismaUserRepository.js';
import { createTestDb, type TestDb } from '@/__tests__/helpers/createTestDb.js';

describe('PrismaUserRepository', () => {
  let db: TestDb;
  let repo: PrismaUserRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new PrismaUserRepository({ prisma: db.prisma });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.prisma.user.deleteMany();
  });

  describe('create', () => {
    it('persists a user and returns the entity', async () => {
      const user = await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });

      expect(user.id).toBe('u1');
      expect(user.email).toBe('a@b.com');
      expect(user.passwordHash).toBe('hashed');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('defaults notification preferences to enabled', async () => {
      const user = await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });

      expect(user.weeklyDigestEnabled).toBe(true);
      expect(user.followUpRemindersEnabled).toBe(true);
    });

    it('defaults emailVerifiedAt to null', async () => {
      const user = await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });
      expect(user.emailVerifiedAt).toBeNull();
    });

    it('defaults profile fields to null', async () => {
      const user = await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });

      expect(user.name).toBeNull();
      expect(user.timezone).toBeNull();
      expect(user.targetRole).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns the user when it exists', async () => {
      await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });
      const found = await repo.findById('u1');

      expect(found?.id).toBe('u1');
      expect(found?.email).toBe('a@b.com');
    });

    it('returns null when the user does not exist', async () => {
      const found = await repo.findById('missing');
      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns the user when the email matches', async () => {
      await repo.create({ id: 'u1', email: 'test@example.com', passwordHash: 'hashed' });
      const found = await repo.findByEmail('test@example.com');

      expect(found?.id).toBe('u1');
    });

    it('returns null for an unrecognised email', async () => {
      const found = await repo.findByEmail('nope@example.com');
      expect(found).toBeNull();
    });

    it('is case-sensitive', async () => {
      await repo.create({ id: 'u1', email: 'test@example.com', passwordHash: 'hashed' });
      const found = await repo.findByEmail('TEST@EXAMPLE.COM');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('updates email and returns the updated entity', async () => {
      await repo.create({ id: 'u1', email: 'old@example.com', passwordHash: 'hashed' });
      const updated = await repo.update('u1', { email: 'new@example.com' });

      expect(updated.email).toBe('new@example.com');
      expect(updated.passwordHash).toBe('hashed');
      expect(updated.id).toBe('u1');
    });

    it('updates passwordHash only', async () => {
      await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'old-hash' });
      const updated = await repo.update('u1', { passwordHash: 'new-hash' });

      expect(updated.passwordHash).toBe('new-hash');
      expect(updated.email).toBe('a@b.com');
    });

    it('updates both email and passwordHash at once', async () => {
      await repo.create({ id: 'u1', email: 'old@example.com', passwordHash: 'old-hash' });
      const updated = await repo.update('u1', {
        email: 'new@example.com',
        passwordHash: 'new-hash',
      });

      expect(updated.email).toBe('new@example.com');
      expect(updated.passwordHash).toBe('new-hash');
    });

    it('returns an entity with Date fields', async () => {
      await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });
      const updated = await repo.update('u1', { email: 'b@c.com' });

      expect(updated.createdAt).toBeInstanceOf(Date);
      expect(updated.updatedAt).toBeInstanceOf(Date);
    });

    it('updates notification preferences', async () => {
      await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });
      const updated = await repo.update('u1', {
        weeklyDigestEnabled: false,
        followUpRemindersEnabled: false,
      });

      expect(updated.weeklyDigestEnabled).toBe(false);
      expect(updated.followUpRemindersEnabled).toBe(false);
    });

    it('sets emailVerifiedAt', async () => {
      await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });
      const verifiedAt = new Date();
      const updated = await repo.update('u1', { emailVerifiedAt: verifiedAt });

      expect(updated.emailVerifiedAt).toEqual(verifiedAt);
    });

    it('clears emailVerifiedAt when given null', async () => {
      await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });
      await repo.update('u1', { emailVerifiedAt: new Date() });
      const updated = await repo.update('u1', { emailVerifiedAt: null });

      expect(updated.emailVerifiedAt).toBeNull();
    });

    it('updates name, timezone, and targetRole', async () => {
      await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });
      const updated = await repo.update('u1', {
        name: 'Jeff Man',
        timezone: 'America/Los_Angeles',
        targetRole: 'Staff Engineer',
      });

      expect(updated.name).toBe('Jeff Man');
      expect(updated.timezone).toBe('America/Los_Angeles');
      expect(updated.targetRole).toBe('Staff Engineer');
    });

    it('clears a profile field when given null', async () => {
      await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });
      await repo.update('u1', { name: 'Jeff Man' });
      const updated = await repo.update('u1', { name: null });

      expect(updated.name).toBeNull();
    });
  });

  describe('delete', () => {
    it('removes the user from the database', async () => {
      await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });
      await repo.delete('u1');

      const found = await repo.findById('u1');
      expect(found).toBeNull();
    });
  });
});
