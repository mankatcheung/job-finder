import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaSessionRepository } from '#src/infrastructure/db/repositories/PrismaSessionRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';

describe('PrismaSessionRepository', () => {
  let db: TestDb;
  let repo: PrismaSessionRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new PrismaSessionRepository({ prisma: db.prisma });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.prisma.session.deleteMany();
    await db.prisma.user.deleteMany();
    await db.prisma.user.create({
      data: { id: 'user-1', email: 'a@b.com', passwordHash: 'hashed' },
    });
  });

  const futureExpiry = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  describe('create', () => {
    it('persists a session and returns the entity', async () => {
      const expiresAt = futureExpiry();
      const session = await repo.create({
        id: 'session-1',
        userId: 'user-1',
        userAgent: 'Mozilla/5.0',
        ipAddress: '10.0.0.1',
        expiresAt,
      });

      expect(session.id).toBe('session-1');
      expect(session.userId).toBe('user-1');
      expect(session.userAgent).toBe('Mozilla/5.0');
      expect(session.ipAddress).toBe('10.0.0.1');
      expect(session.expiresAt).toEqual(expiresAt);
      expect(session.revokedAt).toBeNull();
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.lastUsedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById / findByIdAndUserId', () => {
    it('returns the session when it exists', async () => {
      await repo.create({
        id: 'session-1',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });

      expect((await repo.findById('session-1'))?.id).toBe('session-1');
      expect((await repo.findByIdAndUserId('session-1', 'user-1'))?.id).toBe('session-1');
    });

    it('returns null when the session belongs to a different user', async () => {
      await repo.create({
        id: 'session-1',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });

      expect(await repo.findByIdAndUserId('session-1', 'someone-else')).toBeNull();
    });

    it('returns null when the session does not exist', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findActiveByUserId', () => {
    it('excludes revoked sessions', async () => {
      await repo.create({
        id: 'active',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });
      await repo.create({
        id: 'revoked',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });
      await repo.revoke('revoked');

      const active = await repo.findActiveByUserId('user-1');

      expect(active.map((s) => s.id)).toEqual(['active']);
    });

    it('excludes expired sessions', async () => {
      await repo.create({
        id: 'expired',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: new Date(Date.now() - 1000),
      });

      const active = await repo.findActiveByUserId('user-1');

      expect(active).toHaveLength(0);
    });

    it('does not return sessions belonging to other users', async () => {
      await db.prisma.user.create({
        data: { id: 'user-2', email: 'c@d.com', passwordHash: 'hashed' },
      });
      await repo.create({
        id: 'other-user-session',
        userId: 'user-2',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });

      expect(await repo.findActiveByUserId('user-1')).toHaveLength(0);
    });
  });

  describe('touch', () => {
    it('updates lastUsedAt and expiresAt', async () => {
      await repo.create({
        id: 'session-1',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });
      const newExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      await repo.touch('session-1', newExpiresAt);

      const updated = await repo.findById('session-1');
      expect(updated?.expiresAt).toEqual(newExpiresAt);
    });
  });

  describe('revoke', () => {
    it('sets revokedAt', async () => {
      await repo.create({
        id: 'session-1',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });

      await repo.revoke('session-1');

      const updated = await repo.findById('session-1');
      expect(updated?.revokedAt).toBeInstanceOf(Date);
    });
  });

  describe('revokeAllForUserExcept', () => {
    it('revokes all sessions for the user except the given one', async () => {
      await repo.create({
        id: 'keep',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });
      await repo.create({
        id: 'revoke-me',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });

      await repo.revokeAllForUserExcept('user-1', 'keep');

      const active = await repo.findActiveByUserId('user-1');
      expect(active.map((s) => s.id)).toEqual(['keep']);
    });

    it('does not affect sessions belonging to other users', async () => {
      await db.prisma.user.create({
        data: { id: 'user-2', email: 'c@d.com', passwordHash: 'hashed' },
      });
      await repo.create({
        id: 'mine',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });
      await repo.create({
        id: 'theirs',
        userId: 'user-2',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });

      await repo.revokeAllForUserExcept('user-1', 'mine');

      expect(await repo.findActiveByUserId('user-2')).toHaveLength(1);
    });
  });

  describe('revokeAllForUser', () => {
    it('revokes every session for the user, including the most recently used one', async () => {
      await repo.create({
        id: 'session-a',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });
      await repo.create({
        id: 'session-b',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });

      await repo.revokeAllForUser('user-1');

      expect(await repo.findActiveByUserId('user-1')).toHaveLength(0);
    });

    it('does not affect sessions belonging to other users', async () => {
      await db.prisma.user.create({
        data: { id: 'user-2', email: 'c@d.com', passwordHash: 'hashed' },
      });
      await repo.create({
        id: 'mine',
        userId: 'user-1',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });
      await repo.create({
        id: 'theirs',
        userId: 'user-2',
        userAgent: null,
        ipAddress: null,
        expiresAt: futureExpiry(),
      });

      await repo.revokeAllForUser('user-1');

      expect(await repo.findActiveByUserId('user-2')).toHaveLength(1);
    });
  });
});
