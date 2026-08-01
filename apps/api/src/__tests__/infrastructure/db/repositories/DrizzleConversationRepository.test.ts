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
