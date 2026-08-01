import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DrizzleMessageRepository } from '#src/infrastructure/db/repositories/DrizzleMessageRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, message } from '#src/infrastructure/db/schema.js';

describe('DrizzleMessageRepository', () => {
  let db: TestDb;
  let repo: DrizzleMessageRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleMessageRepository({ db: db.db });
    await db.db.insert(user).values({ id: 'u1', email: 'u@t.com', passwordHash: 'h' });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.db.delete(message);
  });

  describe('create', () => {
    it('persists a message and returns the entity', async () => {
      const msg = await repo.create({
        id: 'msg-1',
        userId: 'u1',
        role: 'user',
        content: 'hi there',
      });

      expect(msg.id).toBe('msg-1');
      expect(msg.userId).toBe('u1');
      expect(msg.role).toBe('user');
      expect(msg.content).toBe('hi there');
      expect(msg.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('findAllByUserId', () => {
    it('returns messages for the user ordered oldest first', async () => {
      await db.db.insert(message).values({
        id: 'msg-1',
        userId: 'u1',
        role: 'user',
        content: 'first',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
      await db.db.insert(message).values({
        id: 'msg-2',
        userId: 'u1',
        role: 'assistant',
        content: 'second',
        createdAt: new Date('2024-01-02T00:00:00Z'),
      });

      const messages = await repo.findAllByUserId('u1');
      expect(messages.map((m) => m.id)).toEqual(['msg-1', 'msg-2']);
    });

    it('does not return another user’s messages', async () => {
      await db.db.insert(user).values({ id: 'u2-find', email: 'u2-find@t.com', passwordHash: 'h' });
      await db.db
        .insert(message)
        .values({ id: 'msg-1', userId: 'u2-find', role: 'user', content: 'not mine' });

      expect(await repo.findAllByUserId('u1')).toHaveLength(0);
    });

    it('returns an empty array when the user has no messages', async () => {
      expect(await repo.findAllByUserId('u1')).toHaveLength(0);
    });
  });

  describe('deleteAllByUserId', () => {
    it('deletes all messages for the user', async () => {
      await db.db
        .insert(message)
        .values({ id: 'msg-1', userId: 'u1', role: 'user', content: 'hi' });

      await repo.deleteAllByUserId('u1');

      expect(await repo.findAllByUserId('u1')).toHaveLength(0);
    });

    it('does not delete another user’s messages', async () => {
      await db.db
        .insert(user)
        .values({ id: 'u2-delete', email: 'u2-delete@t.com', passwordHash: 'h' });
      await db.db
        .insert(message)
        .values({ id: 'msg-1', userId: 'u2-delete', role: 'user', content: 'keep me' });

      await repo.deleteAllByUserId('u1');

      expect(await repo.findAllByUserId('u2-delete')).toHaveLength(1);
    });
  });
});
