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

    it('defaults totpSecret to null and totpEnabled to false', async () => {
      const user = await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });
      expect(user.totpSecret).toBeNull();
      expect(user.totpEnabled).toBe(false);
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

    it('sets totpSecret and totpEnabled', async () => {
      await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });
      const updated = await repo.update('u1', { totpSecret: 'ABCD1234', totpEnabled: true });

      expect(updated.totpSecret).toBe('ABCD1234');
      expect(updated.totpEnabled).toBe(true);
    });

    it('clears totpSecret when given null', async () => {
      await repo.create({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });
      await repo.update('u1', { totpSecret: 'ABCD1234', totpEnabled: true });
      const updated = await repo.update('u1', { totpSecret: null, totpEnabled: false });

      expect(updated.totpSecret).toBeNull();
      expect(updated.totpEnabled).toBe(false);
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
