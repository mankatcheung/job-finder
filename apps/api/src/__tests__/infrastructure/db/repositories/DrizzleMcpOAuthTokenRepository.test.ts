import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user } from '#src/infrastructure/db/schema.js';
import { DrizzleMcpOAuthTokenRepository } from '#src/infrastructure/db/repositories/DrizzleMcpOAuthTokenRepository.js';

describe('DrizzleMcpOAuthTokenRepository', () => {
  let db: TestDb;
  let repository: DrizzleMcpOAuthTokenRepository;

  beforeEach(async () => {
    db = await createTestDb();
    repository = new DrizzleMcpOAuthTokenRepository({ db: db.db });
    await db.db.insert(user).values({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hash',
    });
  });

  afterEach(() => db.cleanup());

  it('creates and retrieves a token by hash', async () => {
    const tokenHash = createHash('sha256').update('trakwyn_mcp_raw').digest('hex');
    await repository.create({
      id: 'token-1',
      userId: 'user-1',
      clientId: 'client-1',
      tokenHash,
      scope: 'read',
      audience: '/mcp',
      expiresAt: new Date('2026-08-19T13:00:00.000Z'),
    });

    await expect(repository.findByTokenHash(tokenHash)).resolves.toMatchObject({
      id: 'token-1',
      userId: 'user-1',
      clientId: 'client-1',
      scope: 'read',
      audience: '/mcp',
    });
  });

  it('updates last-used and revokes a token', async () => {
    const tokenHash = createHash('sha256').update('trakwyn_mcp_revoke').digest('hex');
    await repository.create({
      id: 'token-1',
      userId: 'user-1',
      clientId: 'client-1',
      tokenHash,
      scope: 'full',
      audience: '/mcp',
      expiresAt: new Date('2026-08-19T13:00:00.000Z'),
    });

    await repository.updateLastUsed('token-1');
    await repository.revoke('token-1');

    const token = await repository.findByTokenHash(tokenHash);
    expect(token?.lastUsedAt).toBeInstanceOf(Date);
    expect(token?.revokedAt).toBeInstanceOf(Date);
  });
});
