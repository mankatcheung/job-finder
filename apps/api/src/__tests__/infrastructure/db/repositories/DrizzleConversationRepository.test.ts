import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DrizzleConversationRepository } from '#src/infrastructure/db/repositories/DrizzleConversationRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, conversation, message } from '#src/infrastructure/db/schema.js';

describe('DrizzleConversationRepository', () => {
  let db: TestDb;
  let repo: DrizzleConversationRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleConversationRepository({ db: db.db });
    await db.db.insert(user).values({ id: 'u1', email: 'u@t.com', passwordHash: 'h' });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.db.delete(conversation);
  });

  describe('create', () => {
    it('persists a conversation with a null title and returns the entity', async () => {
      const conv = await repo.create({ id: 'conv-1', userId: 'u1' });

      expect(conv.id).toBe('conv-1');
      expect(conv.userId).toBe('u1');
      expect(conv.title).toBeNull();
      expect(conv.createdAt).toBeInstanceOf(Date);
      expect(conv.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    it('returns the conversation', async () => {
      await db.db.insert(conversation).values({ id: 'conv-1', userId: 'u1', title: 'Hello' });

      const conv = await repo.findById('conv-1');
      expect(conv?.title).toBe('Hello');
    });

    it('returns null when the conversation does not exist', async () => {
      expect(await repo.findById('missing')).toBeNull();
    });
  });

  describe('findAllByUserId', () => {
    it('returns conversations for the user ordered by most-recently-updated first', async () => {
      await db.db.insert(conversation).values({
        id: 'conv-1',
        userId: 'u1',
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      });
      await db.db.insert(conversation).values({
        id: 'conv-2',
        userId: 'u1',
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      });

      const conversations = await repo.findAllByUserId('u1');
      expect(conversations.map((c) => c.id)).toEqual(['conv-2', 'conv-1']);
    });

    it('does not return another user’s conversations', async () => {
      await db.db.insert(user).values({ id: 'u2', email: 'u2@t.com', passwordHash: 'h' });
      await db.db.insert(conversation).values({ id: 'conv-1', userId: 'u2' });

      expect(await repo.findAllByUserId('u1')).toHaveLength(0);
    });

    it('returns at most `limit` conversations when bounded', async () => {
      await db.db.insert(conversation).values([
        { id: 'conv-1', userId: 'u1', updatedAt: new Date('2024-01-01T00:00:00Z') },
        { id: 'conv-2', userId: 'u1', updatedAt: new Date('2024-01-02T00:00:00Z') },
        { id: 'conv-3', userId: 'u1', updatedAt: new Date('2024-01-03T00:00:00Z') },
      ]);

      const conversations = await repo.findAllByUserId('u1', 2);
      // The bound applies to the newest-updated end, not an arbitrary slice.
      expect(conversations.map((c) => c.id)).toEqual(['conv-3', 'conv-2']);
    });
  });

  describe('searchByUserId', () => {
    beforeEach(async () => {
      await db.db.insert(conversation).values([
        {
          id: 'conv-title',
          userId: 'u1',
          title: 'Stripe interview prep',
          updatedAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: 'conv-content',
          userId: 'u1',
          title: 'Untitled thread',
          updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
        {
          id: 'conv-other',
          userId: 'u1',
          title: 'Cover letter draft',
          updatedAt: new Date('2024-01-03T00:00:00Z'),
        },
      ]);
      await db.db.insert(message).values([
        {
          id: 'msg-1',
          conversationId: 'conv-content',
          role: 'user',
          content: 'How much does the offer pay — is 50% above market realistic?',
        },
        {
          id: 'msg-2',
          conversationId: 'conv-other',
          role: 'assistant',
          content: 'Here is a draft cover letter.',
        },
      ]);
    });

    it('matches on conversation title', async () => {
      const results = await repo.searchByUserId('u1', 'stripe');
      expect(results.map((c) => c.id)).toEqual(['conv-title']);
    });

    it('matches on message content when the title does not match', async () => {
      const results = await repo.searchByUserId('u1', 'cover letter');
      expect(results.map((c) => c.id)).toEqual(['conv-other']);
    });

    it('is case-insensitive', async () => {
      const results = await repo.searchByUserId('u1', 'STRIPE');
      expect(results.map((c) => c.id)).toEqual(['conv-title']);
    });

    it('does not return another user’s conversations', async () => {
      // u2 may already exist from the findAllByUserId block — same shared db.
      await db.db
        .insert(user)
        .values({ id: 'u2', email: 'u2@t.com', passwordHash: 'h' })
        .onConflictDoNothing();
      await db.db.insert(conversation).values({
        id: 'conv-u2',
        userId: 'u2',
        title: 'Stripe prep',
      });

      expect(await repo.searchByUserId('u2', 'stripe').then((r) => r.map((c) => c.id))).toEqual([
        'conv-u2',
      ]);
      expect(await repo.searchByUserId('u1', 'stripe').then((r) => r.map((c) => c.id))).toEqual([
        'conv-title',
      ]);
    });

    it('treats LIKE wildcards in the term literally', async () => {
      // "50%" exists verbatim in conv-content's message; a naive LIKE would
      // also match any conversation whose text contains "50" + anything.
      const literal = await repo.searchByUserId('u1', '50%');
      expect(literal.map((c) => c.id)).toEqual(['conv-content']);

      // An underscore-only term must not act as a single-char wildcard and
      // match everything.
      expect(await repo.searchByUserId('u1', '_')).toHaveLength(0);
    });

    it('orders matches by most-recently-updated first', async () => {
      // 'r' appears in all three titles, so the full set comes back ordered.
      const results = await repo.searchByUserId('u1', 'r');
      expect(await Promise.all(results.map((c) => c.title ?? ''))).toEqual([
        'Cover letter draft',
        'Untitled thread',
        'Stripe interview prep',
      ]);
    });
  });

  describe('updateTitle', () => {
    it('updates the title', async () => {
      await db.db.insert(conversation).values({ id: 'conv-1', userId: 'u1' });

      await repo.updateTitle('conv-1', 'New title');

      expect((await repo.findById('conv-1'))?.title).toBe('New title');
    });
  });

  describe('updateLlmSettings', () => {
    it('locks in the provider and model', async () => {
      await db.db.insert(conversation).values({ id: 'conv-1', userId: 'u1' });

      await repo.updateLlmSettings('conv-1', 'openai', 'gpt-4o');

      const conv = await repo.findById('conv-1');
      expect(conv?.llmProvider).toBe('openai');
      expect(conv?.llmModel).toBe('gpt-4o');
    });

    it('allows a null model', async () => {
      await db.db.insert(conversation).values({ id: 'conv-1', userId: 'u1' });

      await repo.updateLlmSettings('conv-1', 'anthropic', null);

      const conv = await repo.findById('conv-1');
      expect(conv?.llmProvider).toBe('anthropic');
      expect(conv?.llmModel).toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes the conversation and cascades to its messages', async () => {
      await db.db.insert(conversation).values({ id: 'conv-1', userId: 'u1' });
      await db.db
        .insert(message)
        .values({ id: 'msg-1', conversationId: 'conv-1', role: 'user', content: 'hi' });

      await repo.delete('conv-1');

      expect(await repo.findById('conv-1')).toBeNull();
      const remaining = await db.db.select().from(message);
      expect(remaining).toHaveLength(0);
    });
  });
});
