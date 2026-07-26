import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaEmailVerificationTokenRepository } from '#src/infrastructure/db/repositories/PrismaEmailVerificationTokenRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';

describe('PrismaEmailVerificationTokenRepository', () => {
  let db: TestDb;
  let repo: PrismaEmailVerificationTokenRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new PrismaEmailVerificationTokenRepository({ prisma: db.prisma });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.prisma.emailVerificationToken.deleteMany();
    await db.prisma.user.deleteMany();
    await db.prisma.user.create({
      data: { id: 'user-1', email: 'a@b.com', passwordHash: 'hashed' },
    });
  });

  describe('create', () => {
    it('persists a token and returns the entity', async () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const token = await repo.create({
        id: 'verify-1',
        userId: 'user-1',
        tokenHash: 'hash-1',
        expiresAt,
      });

      expect(token.id).toBe('verify-1');
      expect(token.userId).toBe('user-1');
      expect(token.tokenHash).toBe('hash-1');
      expect(token.expiresAt).toEqual(expiresAt);
      expect(token.usedAt).toBeNull();
      expect(token.createdAt).toBeInstanceOf(Date);
      expect(token.newEmail).toBeNull();
    });

    it('persists newEmail when creating an email-change confirmation token', async () => {
      const token = await repo.create({
        id: 'verify-2',
        userId: 'user-1',
        tokenHash: 'hash-2',
        newEmail: 'new@example.com',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      expect(token.newEmail).toBe('new@example.com');

      const found = await repo.findByTokenHash('hash-2');
      expect(found?.newEmail).toBe('new@example.com');
    });
  });

  describe('findByTokenHash', () => {
    it('returns the token when it exists', async () => {
      await repo.create({
        id: 'verify-1',
        userId: 'user-1',
        tokenHash: 'hash-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const found = await repo.findByTokenHash('hash-1');
      expect(found?.id).toBe('verify-1');
    });

    it('returns null when no token matches', async () => {
      const found = await repo.findByTokenHash('missing-hash');
      expect(found).toBeNull();
    });
  });

  describe('markUsed', () => {
    it('sets usedAt on the token', async () => {
      await repo.create({
        id: 'verify-1',
        userId: 'user-1',
        tokenHash: 'hash-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await repo.markUsed('verify-1');

      const found = await repo.findByTokenHash('hash-1');
      expect(found?.usedAt).toBeInstanceOf(Date);
    });
  });

  describe('deleteAllForUser', () => {
    it('removes all tokens for the given user', async () => {
      await repo.create({
        id: 'verify-1',
        userId: 'user-1',
        tokenHash: 'hash-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      await repo.create({
        id: 'verify-2',
        userId: 'user-1',
        tokenHash: 'hash-2',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await repo.deleteAllForUser('user-1');

      expect(await repo.findByTokenHash('hash-1')).toBeNull();
      expect(await repo.findByTokenHash('hash-2')).toBeNull();
    });

    it('does not affect tokens belonging to other users', async () => {
      await db.prisma.user.create({
        data: { id: 'user-2', email: 'c@d.com', passwordHash: 'hashed' },
      });
      await repo.create({
        id: 'verify-1',
        userId: 'user-1',
        tokenHash: 'hash-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      await repo.create({
        id: 'verify-2',
        userId: 'user-2',
        tokenHash: 'hash-2',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await repo.deleteAllForUser('user-1');

      expect(await repo.findByTokenHash('hash-1')).toBeNull();
      expect(await repo.findByTokenHash('hash-2')).not.toBeNull();
    });
  });
});
