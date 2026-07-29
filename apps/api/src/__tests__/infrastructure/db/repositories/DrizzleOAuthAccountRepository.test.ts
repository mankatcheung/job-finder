import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DrizzleOAuthAccountRepository } from '#src/infrastructure/db/repositories/DrizzleOAuthAccountRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, oauthAccount } from '#src/infrastructure/db/schema.js';

describe('DrizzleOAuthAccountRepository', () => {
  let db: TestDb;
  let repo: DrizzleOAuthAccountRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleOAuthAccountRepository({ db: db.db });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.db.delete(oauthAccount);
    await db.db.delete(user);
    await db.db.insert(user).values({ id: 'user-1', email: 'a@b.com', passwordHash: null });
  });

  describe('create', () => {
    it('persists a link and returns the entity', async () => {
      const account = await repo.create({
        id: 'link-1',
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'google-sub-1',
        email: 'a@b.com',
      });

      expect(account.id).toBe('link-1');
      expect(account.provider).toBe('google');
      expect(account.providerAccountId).toBe('google-sub-1');
      expect(account.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('findByProvider', () => {
    it('returns the account when the provider+providerAccountId matches', async () => {
      await repo.create({
        id: 'link-1',
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'google-sub-1',
        email: 'a@b.com',
      });

      const found = await repo.findByProvider('google', 'google-sub-1');
      expect(found?.id).toBe('link-1');
    });

    it('returns null when no account matches', async () => {
      const found = await repo.findByProvider('google', 'missing');
      expect(found).toBeNull();
    });

    it('does not confuse the same providerAccountId across different providers', async () => {
      await repo.create({
        id: 'link-1',
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'shared-id',
        email: 'a@b.com',
      });

      const found = await repo.findByProvider('github', 'shared-id');
      expect(found).toBeNull();
    });
  });

  describe('findAllByUserId', () => {
    it('returns all linked accounts for the user', async () => {
      await repo.create({
        id: 'link-1',
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'google-sub-1',
        email: 'a@b.com',
      });
      await repo.create({
        id: 'link-2',
        userId: 'user-1',
        provider: 'github',
        providerAccountId: 'github-id-1',
        email: null,
      });

      const found = await repo.findAllByUserId('user-1');
      expect(found).toHaveLength(2);
    });

    it('returns an empty array when there are none', async () => {
      const found = await repo.findAllByUserId('user-1');
      expect(found).toEqual([]);
    });
  });

  describe('delete', () => {
    it('removes the link', async () => {
      await repo.create({
        id: 'link-1',
        userId: 'user-1',
        provider: 'google',
        providerAccountId: 'google-sub-1',
        email: 'a@b.com',
      });

      await repo.delete('link-1');

      expect(await repo.findByProvider('google', 'google-sub-1')).toBeNull();
    });
  });
});
