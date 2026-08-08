import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { DrizzleShareLinkRepository } from '#src/infrastructure/db/repositories/DrizzleShareLinkRepository.js';
import { user } from '#src/infrastructure/db/schema.js';

describe('DrizzleShareLinkRepository', () => {
  let db: TestDb;
  let repo: DrizzleShareLinkRepository;

  beforeEach(async () => {
    db = await createTestDb();
    repo = new DrizzleShareLinkRepository({ db: db.db });

    await db.db.insert(user).values({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hash',
    });
  });

  afterEach(() => db.cleanup());

  it('creates a link and retrieves it by userId', async () => {
    const hash = createHash('sha256').update('jfsl_abc').digest('hex');
    await repo.create({ id: 'link-1', userId: 'user-1', name: 'For my mentor', tokenHash: hash });

    const links = await repo.findAllByUserId('user-1');

    expect(links).toHaveLength(1);
    expect(links[0].name).toBe('For my mentor');
    expect(links[0].tokenHash).toBe(hash);
  });

  it('findByTokenHash returns the link for a valid hash', async () => {
    const raw = 'jfsl_abc123';
    const hash = createHash('sha256').update(raw).digest('hex');
    await repo.create({ id: 'link-1', userId: 'user-1', name: 'My link', tokenHash: hash });

    const result = await repo.findByTokenHash(hash);

    expect(result).not.toBeNull();
    expect(result!.id).toBe('link-1');
    expect(result!.userId).toBe('user-1');
  });

  it('findByTokenHash returns null for unknown hash', async () => {
    const result = await repo.findByTokenHash('nonexistent');
    expect(result).toBeNull();
  });

  it('findByIdAndUserId returns null when the link belongs to another user', async () => {
    const hash = createHash('sha256').update('jfsl_owner').digest('hex');
    await repo.create({ id: 'link-1', userId: 'user-1', name: 'T', tokenHash: hash });

    const result = await repo.findByIdAndUserId('link-1', 'someone-else');

    expect(result).toBeNull();
  });

  it('updateLastUsed sets lastUsedAt', async () => {
    const hash = createHash('sha256').update('jfsl_xyz').digest('hex');
    await repo.create({ id: 'link-1', userId: 'user-1', name: 'T', tokenHash: hash });

    const before = await repo.findByTokenHash(hash);
    expect(before!.lastUsedAt).toBeNull();

    await repo.updateLastUsed('link-1');

    const after = (await repo.findAllByUserId('user-1'))[0];
    expect(after.lastUsedAt).toBeInstanceOf(Date);
  });

  it('delete removes the link', async () => {
    const hash = createHash('sha256').update('jfsl_del').digest('hex');
    await repo.create({ id: 'link-1', userId: 'user-1', name: 'T', tokenHash: hash });
    await repo.delete('link-1');

    const links = await repo.findAllByUserId('user-1');
    expect(links).toHaveLength(0);
  });

  it('cascades deletion when user is deleted', async () => {
    const hash = createHash('sha256').update('jfsl_cas').digest('hex');
    await repo.create({ id: 'link-1', userId: 'user-1', name: 'T', tokenHash: hash });

    await db.db.delete(user);

    const links = await repo.findAllByUserId('user-1');
    expect(links).toHaveLength(0);
  });
});
