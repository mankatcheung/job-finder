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
      familyId: 'grant-1',
      tokenHash,
      scope: 'read',
      audience: '/mcp',
      expiresAt: new Date('2026-08-19T13:00:00.000Z'),
    });

    await expect(repository.findByTokenHash(tokenHash)).resolves.toMatchObject({
      id: 'token-1',
      userId: 'user-1',
      clientId: 'client-1',
      familyId: 'grant-1',
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
      familyId: 'grant-1',
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

  it('revokes every live token in a grant, preserving earlier revocation times', async () => {
    const hashes = ['a', 'b', 'c'].map((seed) =>
      createHash('sha256').update(`trakwyn_mcp_${seed}`).digest('hex'),
    );
    await Promise.all(
      hashes.map((tokenHash, index) =>
        repository.create({
          id: `token-${index}`,
          userId: 'user-1',
          // The third token belongs to a different grant and must survive.
          clientId: 'client-1',
          familyId: index === 2 ? 'grant-2' : 'grant-1',
          tokenHash,
          scope: 'read',
          audience: '/mcp',
          expiresAt: new Date('2026-08-19T13:00:00.000Z'),
        }),
      ),
    );
    const alreadyRevoked = new Date('2026-08-19T10:00:00.000Z');
    await repository.revokeFamily('grant-1', alreadyRevoked);

    const later = new Date('2026-08-19T12:00:00.000Z');
    await repository.revokeFamily('grant-1', later);

    const [first, , other] = await Promise.all(hashes.map((h) => repository.findByTokenHash(h)));
    // Re-revoking keeps the original timestamp so the audit trail stays honest.
    expect(first?.revokedAt).toEqual(alreadyRevoked);
    expect(other?.revokedAt).toBeNull();
  });
});
