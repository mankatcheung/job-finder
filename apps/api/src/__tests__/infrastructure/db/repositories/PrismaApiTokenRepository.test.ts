import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { PrismaApiTokenRepository } from '#src/infrastructure/db/repositories/PrismaApiTokenRepository.js';

describe('PrismaApiTokenRepository', () => {
  let db: TestDb;
  let repo: PrismaApiTokenRepository;

  beforeEach(async () => {
    db = await createTestDb();
    repo = new PrismaApiTokenRepository({ prisma: db.prisma });

    await db.prisma.$executeRawUnsafe(
      `INSERT INTO "User" (id, email, passwordHash, createdAt, updatedAt)
       VALUES ('user-1', 'test@example.com', 'hash', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    );
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

    await db.prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE id = 'user-1'`);

    const tokens = await repo.findAllByUserId('user-1');
    expect(tokens).toHaveLength(0);
  });
});
