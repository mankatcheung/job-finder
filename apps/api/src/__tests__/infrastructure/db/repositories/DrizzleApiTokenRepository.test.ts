import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { DrizzleApiTokenRepository } from '#src/infrastructure/db/repositories/DrizzleApiTokenRepository.js';
import { user } from '#src/infrastructure/db/schema.js';

describe('DrizzleApiTokenRepository', () => {
  let db: TestDb;
  let repo: DrizzleApiTokenRepository;

  beforeEach(async () => {
    db = await createTestDb();
    repo = new DrizzleApiTokenRepository({ db: db.db });

    await db.db.insert(user).values({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hash',
    });
  });

  afterEach(() => db.cleanup());

  it('creates a token and retrieves it by userId', async () => {
    const hash = createHash('sha256').update('jfat_abc').digest('hex');
    await repo.create({
      id: 'tok-1',
      userId: 'user-1',
      name: 'CLI',
      tokenHash: hash,
      scope: 'full',
    });

    const tokens = await repo.findAllByUserId('user-1');

    expect(tokens).toHaveLength(1);
    expect(tokens[0].name).toBe('CLI');
    expect(tokens[0].tokenHash).toBe(hash);
  });

  it('findByTokenHash returns token + userEmail for a valid hash', async () => {
    const raw = 'jfat_abc123';
    const hash = createHash('sha256').update(raw).digest('hex');
    await repo.create({
      id: 'tok-1',
      userId: 'user-1',
      name: 'My token',
      tokenHash: hash,
      scope: 'full',
    });

    const result = await repo.findByTokenHash(hash);

    expect(result).not.toBeNull();
    expect(result!.token.id).toBe('tok-1');
    expect(result!.userEmail).toBe('test@example.com');
  });

  it('findByTokenHash returns null for unknown hash', async () => {
    const result = await repo.findByTokenHash('nonexistent');
    expect(result).toBeNull();
  });

  it('updateLastUsed sets lastUsedAt', async () => {
    const hash = createHash('sha256').update('jfat_xyz').digest('hex');
    await repo.create({ id: 'tok-1', userId: 'user-1', name: 'T', tokenHash: hash, scope: 'full' });

    const before = await repo.findByTokenHash(hash);
    expect(before!.token.lastUsedAt).toBeNull();

    await repo.updateLastUsed('tok-1');

    const after = (await repo.findAllByUserId('user-1'))[0];
    expect(after.lastUsedAt).toBeInstanceOf(Date);
  });

  it('delete removes the token', async () => {
    const hash = createHash('sha256').update('jfat_del').digest('hex');
    await repo.create({ id: 'tok-1', userId: 'user-1', name: 'T', tokenHash: hash, scope: 'full' });
    await repo.delete('tok-1');

    const tokens = await repo.findAllByUserId('user-1');
    expect(tokens).toHaveLength(0);
  });

  it('cascades deletion when user is deleted', async () => {
    const hash = createHash('sha256').update('jfat_cas').digest('hex');
    await repo.create({ id: 'tok-1', userId: 'user-1', name: 'T', tokenHash: hash, scope: 'full' });

    await db.db.delete(user);

    const tokens = await repo.findAllByUserId('user-1');
    expect(tokens).toHaveLength(0);
  });
});
