import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DrizzleLlmUsageEventRepository } from '#src/infrastructure/db/repositories/DrizzleLlmUsageEventRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, llmUsageEvent } from '#src/infrastructure/db/schema.js';

describe('DrizzleLlmUsageEventRepository', () => {
  let db: TestDb;
  let repo: DrizzleLlmUsageEventRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleLlmUsageEventRepository({ db: db.db });
    await db.db.insert(user).values({ id: 'u1', email: 'u@t.com', passwordHash: 'h' });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.db.delete(llmUsageEvent);
  });

  describe('record', () => {
    it('inserts a row', async () => {
      await repo.record({
        id: 'evt-1',
        userId: 'u1',
        provider: 'openrouter',
        model: 'gpt-4o-mini',
        promptTokens: 100,
        completionTokens: 20,
      });

      const summary = await repo.summarizeByUserId('u1');
      expect(summary).toEqual([
        {
          provider: 'openrouter',
          requestCount: 1,
          promptTokens: 100,
          completionTokens: 20,
          lastUsedAt: expect.any(Date),
        },
      ]);
    });
  });

  describe('summarizeByUserId', () => {
    it('sums tokens and counts requests per provider, across every model that provider was used with', async () => {
      await repo.record({
        id: 'evt-1',
        userId: 'u1',
        provider: 'openrouter',
        model: 'gpt-4o-mini',
        promptTokens: 100,
        completionTokens: 20,
      });
      await repo.record({
        id: 'evt-2',
        userId: 'u1',
        provider: 'openrouter',
        model: 'gpt-4o',
        promptTokens: 200,
        completionTokens: 40,
      });

      const summary = await repo.summarizeByUserId('u1');

      expect(summary).toHaveLength(1);
      expect(summary[0]).toMatchObject({
        provider: 'openrouter',
        requestCount: 2,
        promptTokens: 300,
        completionTokens: 60,
      });
    });

    it('keeps separate providers as separate rows, most-recently-used first', async () => {
      await repo.record({
        id: 'evt-1',
        userId: 'u1',
        provider: 'openrouter',
        model: null,
        promptTokens: 10,
        completionTokens: 5,
      });
      await repo.record({
        id: 'evt-2',
        userId: 'u1',
        provider: 'anthropic',
        model: null,
        promptTokens: 10,
        completionTokens: 5,
      });

      const summary = await repo.summarizeByUserId('u1');

      expect(summary.map((s) => s.provider)).toEqual(['anthropic', 'openrouter']);
    });

    it("does not include another user's events", async () => {
      await db.db.insert(user).values({ id: 'u2', email: 'u2@t.com', passwordHash: 'h' });
      await repo.record({
        id: 'evt-1',
        userId: 'u2',
        provider: 'openrouter',
        model: null,
        promptTokens: 10,
        completionTokens: 5,
      });

      expect(await repo.summarizeByUserId('u1')).toEqual([]);
    });

    it('returns an empty array when nothing has been recorded', async () => {
      expect(await repo.summarizeByUserId('u1')).toEqual([]);
    });
  });
});
