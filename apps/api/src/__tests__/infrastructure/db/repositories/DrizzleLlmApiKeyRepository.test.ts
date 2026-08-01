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
});
