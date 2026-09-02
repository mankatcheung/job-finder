import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DrizzleLlmApiKeyRepository } from '#src/infrastructure/db/repositories/DrizzleLlmApiKeyRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, llmApiKey } from '#src/infrastructure/db/schema.js';

describe('DrizzleLlmApiKeyRepository', () => {
  let db: TestDb;
  let repo: DrizzleLlmApiKeyRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleLlmApiKeyRepository({ db: db.db });
    await db.db.insert(user).values({ id: 'u1', email: 'u@t.com', passwordHash: 'h' });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.db.delete(llmApiKey);
  });

  describe('upsert', () => {
    it('inserts a new row when none exists for the provider', async () => {
      const created = await repo.upsert({
        id: 'key-1',
        userId: 'u1',
        provider: 'openai',
        apiKey: 'encrypted:sk-123',
        model: 'gpt-4o',
        baseUrl: null,
      });

      expect(created.id).toBe('key-1');
      expect(created.provider).toBe('openai');
      expect(created.apiKey).toBe('encrypted:sk-123');
      expect(created.model).toBe('gpt-4o');
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
    });

    it('updates the existing row for that user+provider instead of duplicating it', async () => {
      await repo.upsert({
        id: 'key-1',
        userId: 'u1',
        provider: 'openai',
        apiKey: 'encrypted:sk-old',
        model: null,
        baseUrl: null,
      });

      const updated = await repo.upsert({
        id: 'key-2',
        userId: 'u1',
        provider: 'openai',
        apiKey: 'encrypted:sk-new',
        model: 'gpt-4o-mini',
        baseUrl: null,
      });

      expect(updated.id).toBe('key-1');
      expect(updated.apiKey).toBe('encrypted:sk-new');
      expect(updated.model).toBe('gpt-4o-mini');

      const all = await repo.findAllByUserId('u1');
      expect(all).toHaveLength(1);
    });

    it('keeps separate rows for different providers on the same user', async () => {
      await repo.upsert({
        id: 'key-1',
        userId: 'u1',
        provider: 'openai',
        apiKey: 'encrypted:sk-openai',
        model: null,
        baseUrl: null,
      });
      await repo.upsert({
        id: 'key-2',
        userId: 'u1',
        provider: 'anthropic',
        apiKey: 'encrypted:sk-anthropic',
        model: null,
        baseUrl: null,
      });

      const all = await repo.findAllByUserId('u1');
      expect(all.map((k) => k.provider).sort()).toEqual(['anthropic', 'openai']);
    });
  });

  describe('findByUserIdAndProvider', () => {
    it('returns the matching key', async () => {
      await repo.upsert({
        id: 'key-1',
        userId: 'u1',
        provider: 'openai',
        apiKey: 'encrypted:sk-123',
        model: null,
        baseUrl: null,
      });

      const found = await repo.findByUserIdAndProvider('u1', 'openai');
      expect(found?.id).toBe('key-1');
    });

    it('returns null when no key exists for that provider', async () => {
      expect(await repo.findByUserIdAndProvider('u1', 'openai')).toBeNull();
    });
  });

  describe('findAllByUserId', () => {
    it('does not return another user’s keys', async () => {
      await db.db.insert(user).values({ id: 'u2', email: 'u2@t.com', passwordHash: 'h' });
      await repo.upsert({
        id: 'key-1',
        userId: 'u2',
        provider: 'openai',
        apiKey: 'encrypted:sk-123',
        model: null,
        baseUrl: null,
      });

      expect(await repo.findAllByUserId('u1')).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('deletes the key for that user+provider', async () => {
      await repo.upsert({
        id: 'key-1',
        userId: 'u1',
        provider: 'openai',
        apiKey: 'encrypted:sk-123',
        model: null,
        baseUrl: null,
      });

      await repo.delete('u1', 'openai');

      expect(await repo.findByUserIdAndProvider('u1', 'openai')).toBeNull();
    });
  });

  describe('setMonthlyTokenLimit', () => {
    const seed = () =>
      repo.upsert({
        id: 'key-1',
        userId: 'u1',
        provider: 'openai',
        apiKey: 'encrypted:sk-123',
        model: null,
        baseUrl: null,
      });

    it('defaults a newly saved key to no limit', async () => {
      const created = await seed();

      expect(created.monthlyTokenLimit).toBeNull();
    });

    it('sets a limit and reads it back', async () => {
      await seed();

      const updated = await repo.setMonthlyTokenLimit('u1', 'openai', 2_000_000);

      expect(updated?.monthlyTokenLimit).toBe(2_000_000);
      expect((await repo.findByUserIdAndProvider('u1', 'openai'))?.monthlyTokenLimit).toBe(
        2_000_000,
      );
    });

    it('clears a limit with null', async () => {
      await seed();
      await repo.setMonthlyTokenLimit('u1', 'openai', 2_000_000);

      await repo.setMonthlyTokenLimit('u1', 'openai', null);

      expect((await repo.findByUserIdAndProvider('u1', 'openai'))?.monthlyTokenLimit).toBeNull();
    });

    it('returns null for a provider the user has no key for', async () => {
      expect(await repo.setMonthlyTokenLimit('u1', 'mistral', 10)).toBeNull();
    });

    /**
     * Rotating an API key must not silently drop the ceiling on it — the
     * upsert deliberately does not touch this column, and that is easy to
     * break by adding it to the `set()` alongside the other fields.
     */
    it('keeps the limit when the key itself is re-saved', async () => {
      await seed();
      await repo.setMonthlyTokenLimit('u1', 'openai', 500_000);

      await repo.upsert({
        id: 'key-2',
        userId: 'u1',
        provider: 'openai',
        apiKey: 'encrypted:sk-rotated',
        model: 'gpt-4o-mini',
        baseUrl: null,
      });

      const after = await repo.findByUserIdAndProvider('u1', 'openai');
      expect(after?.apiKey).toBe('encrypted:sk-rotated');
      expect(after?.monthlyTokenLimit).toBe(500_000);
    });
  });
});
