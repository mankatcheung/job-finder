import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import {
  mcpOAuthAccessToken,
  mcpOAuthAuthorizationCode,
  mcpOAuthClient,
  mcpOAuthRefreshToken,
  user,
} from '#src/infrastructure/db/schema.js';
import { DrizzleMcpOAuthGrantRepository } from '#src/infrastructure/db/repositories/DrizzleMcpOAuthGrantRepository.js';

describe('DrizzleMcpOAuthGrantRepository', () => {
  const now = new Date('2026-08-20T12:00:00.000Z');
  const past = new Date('2026-08-19T09:00:00.000Z');
  const future = new Date('2026-09-19T09:00:00.000Z');
  let db: TestDb;
  let repository: DrizzleMcpOAuthGrantRepository;
  let seq = 0;

  beforeEach(async () => {
    db = await createTestDb();
    repository = new DrizzleMcpOAuthGrantRepository({ db: db.db });
    await db.db.insert(user).values([
      { id: 'user-1', email: 'one@example.com', passwordHash: 'hash' },
      { id: 'user-2', email: 'two@example.com', passwordHash: 'hash' },
    ]);
    await db.db.insert(mcpOAuthClient).values([
      { id: 'client-1', name: 'Claude Desktop', redirectUris: '[]', createdAt: past },
      { id: 'client-2', name: 'Some Other Client', redirectUris: '[]', createdAt: past },
    ]);
  });

  afterEach(() => db.cleanup());

  async function seedGrant(opts: {
    familyId: string;
    userId?: string;
    clientId?: string;
    scope?: 'read' | 'full';
    authorizedAt?: Date;
    refreshExpiresAt?: Date | null;
    refreshRevokedAt?: Date | null;
    lastUsedAt?: Date | null;
  }) {
    seq += 1;
    const userId = opts.userId ?? 'user-1';
    const clientId = opts.clientId ?? 'client-1';
    const scope = opts.scope ?? 'read';
    await db.db.insert(mcpOAuthAuthorizationCode).values({
      id: `code-${seq}`,
      codeHash: `code-hash-${seq}`,
      familyId: opts.familyId,
      clientId,
      userId,
      redirectUri: 'http://127.0.0.1/cb',
      scope,
      codeChallenge: 'challenge',
      codeChallengeMethod: 'S256',
      expiresAt: future,
      createdAt: opts.authorizedAt ?? past,
    });
    if (opts.refreshExpiresAt !== null) {
      await db.db.insert(mcpOAuthRefreshToken).values({
        id: `refresh-${seq}`,
        tokenHash: `refresh-hash-${seq}`,
        familyId: opts.familyId,
        clientId,
        userId,
        scope,
        expiresAt: opts.refreshExpiresAt ?? future,
        revokedAt: opts.refreshRevokedAt ?? null,
        createdAt: past,
      });
    }
    if (opts.lastUsedAt !== undefined) {
      await db.db.insert(mcpOAuthAccessToken).values({
        id: `access-${seq}`,
        userId,
        clientId,
        familyId: opts.familyId,
        tokenHash: `access-hash-${seq}`,
        scope,
        audience: '/mcp',
        expiresAt: future,
        lastUsedAt: opts.lastUsedAt,
        createdAt: past,
      });
    }
  }

  it('describes a live grant by the consent that created it', async () => {
    await seedGrant({
      familyId: 'grant-1',
      scope: 'full',
      authorizedAt: past,
      lastUsedAt: new Date('2026-08-20T11:00:00.000Z'),
    });

    const grants = await repository.findActiveByUserId('user-1', now);

    expect(grants).toEqual([
      {
        id: 'grant-1',
        userId: 'user-1',
        clientId: 'client-1',
        clientName: 'Claude Desktop',
        scope: 'full',
        authorizedAt: past,
        lastUsedAt: new Date('2026-08-20T11:00:00.000Z'),
      },
    ]);
  });

  it('never returns another user’s grants', async () => {
    await seedGrant({ familyId: 'mine' });
    await seedGrant({ familyId: 'theirs', userId: 'user-2' });

    const grants = await repository.findActiveByUserId('user-1', now);

    expect(grants.map((g) => g.id)).toEqual(['mine']);
  });

  it('omits a grant whose refresh token was revoked', async () => {
    await seedGrant({ familyId: 'live' });
    await seedGrant({ familyId: 'revoked', refreshRevokedAt: now });

    const grants = await repository.findActiveByUserId('user-1', now);

    expect(grants.map((g) => g.id)).toEqual(['live']);
  });

  it('omits a grant whose refresh token has expired', async () => {
    await seedGrant({ familyId: 'live' });
    await seedGrant({ familyId: 'expired', refreshExpiresAt: new Date(now.getTime() - 1) });

    const grants = await repository.findActiveByUserId('user-1', now);

    expect(grants.map((g) => g.id)).toEqual(['live']);
  });

  it('keeps a grant whose access token has expired but whose refresh token has not', async () => {
    // An access token lives an hour; a grant lives thirty days. Dropping the
    // grant when the access token lapses would hide clients that are still
    // fully able to come back.
    await seedGrant({ familyId: 'idle', lastUsedAt: null });

    const grants = await repository.findActiveByUserId('user-1', now);

    expect(grants.map((g) => g.id)).toEqual(['idle']);
    expect(grants[0].lastUsedAt).toBeNull();
  });

  it('reports the most recent use across a rotated family', async () => {
    await seedGrant({ familyId: 'grant-1', lastUsedAt: new Date('2026-08-20T09:00:00.000Z') });
    // A second access token in the same family, from a later rotation.
    await db.db.insert(mcpOAuthAccessToken).values({
      id: 'access-later',
      userId: 'user-1',
      clientId: 'client-1',
      familyId: 'grant-1',
      tokenHash: 'access-hash-later',
      scope: 'read',
      audience: '/mcp',
      expiresAt: future,
      lastUsedAt: new Date('2026-08-20T11:30:00.000Z'),
      createdAt: past,
    });

    const grants = await repository.findActiveByUserId('user-1', now);

    expect(grants[0].lastUsedAt).toEqual(new Date('2026-08-20T11:30:00.000Z'));
  });

  it('lists the most recently authorized grant first', async () => {
    await seedGrant({ familyId: 'older', authorizedAt: new Date('2026-08-01T00:00:00.000Z') });
    await seedGrant({
      familyId: 'newer',
      clientId: 'client-2',
      authorizedAt: new Date('2026-08-18T00:00:00.000Z'),
    });

    const grants = await repository.findActiveByUserId('user-1', now);

    expect(grants.map((g) => g.id)).toEqual(['newer', 'older']);
    expect(grants.map((g) => g.clientName)).toEqual(['Some Other Client', 'Claude Desktop']);
  });

  it('returns nothing for a user who has authorized no clients', async () => {
    await expect(repository.findActiveByUserId('user-1', now)).resolves.toEqual([]);
  });
});
