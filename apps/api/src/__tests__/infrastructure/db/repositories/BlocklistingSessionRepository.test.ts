import { describe, it, expect, vi } from 'vitest';
import { BlocklistingSessionRepository } from '#src/infrastructure/db/repositories/BlocklistingSessionRepository.js';
import { MemorySessionBlocklist } from '#src/infrastructure/sessionBlocklist/MemorySessionBlocklist.js';
import { makeSessionRepository, makeSession } from '#src/__tests__/helpers/mocks.js';

function makeRepo(innerOverrides?: Parameters<typeof makeSessionRepository>[0]) {
  const drizzleSessionRepository = makeSessionRepository(innerOverrides);
  const sessionBlocklist = new MemorySessionBlocklist();
  const repo = new BlocklistingSessionRepository({ drizzleSessionRepository, sessionBlocklist });
  return { repo, inner: drizzleSessionRepository, sessionBlocklist };
}

describe('BlocklistingSessionRepository', () => {
  describe('revoke (logout, and revoking one listed device)', () => {
    it('revokes in the DB and blocklists the session id', async () => {
      const { repo, inner, sessionBlocklist } = makeRepo();

      await repo.revoke('session-1');

      expect(inner.revoke).toHaveBeenCalledWith('session-1');
      expect(await sessionBlocklist.isRevoked('session-1')).toBe(true);
    });
  });

  describe('revokeAllForUserExcept ("sign out other sessions")', () => {
    it('blocklists every revoked session but spares the current one', async () => {
      const { repo, inner, sessionBlocklist } = makeRepo({
        findActiveByUserId: vi
          .fn()
          .mockResolvedValue([
            makeSession({ id: 'session-1' }),
            makeSession({ id: 'session-2' }),
            makeSession({ id: 'session-current' }),
          ]),
      });

      await repo.revokeAllForUserExcept('user-1', 'session-current');

      expect(inner.revokeAllForUserExcept).toHaveBeenCalledWith('user-1', 'session-current');
      expect(await sessionBlocklist.isRevoked('session-1')).toBe(true);
      expect(await sessionBlocklist.isRevoked('session-2')).toBe(true);
      // Blocklisting this one would log the user out of the very device
      // they used to sign the others out.
      expect(await sessionBlocklist.isRevoked('session-current')).toBe(false);
    });

    it('reads the affected ids before revoking them, since afterwards none are still active', async () => {
      const callOrder: string[] = [];
      const { repo } = makeRepo({
        findActiveByUserId: vi.fn().mockImplementation(async () => {
          callOrder.push('findActiveByUserId');
          return [makeSession({ id: 'session-1' })];
        }),
        revokeAllForUserExcept: vi.fn().mockImplementation(async () => {
          callOrder.push('revokeAllForUserExcept');
        }),
      });

      await repo.revokeAllForUserExcept('user-1', 'session-current');

      expect(callOrder).toEqual(['findActiveByUserId', 'revokeAllForUserExcept']);
    });
  });

  describe('revokeAllForUser (password reset)', () => {
    it('blocklists every one of the user’s active sessions', async () => {
      const { repo, inner, sessionBlocklist } = makeRepo({
        findActiveByUserId: vi
          .fn()
          .mockResolvedValue([makeSession({ id: 'session-1' }), makeSession({ id: 'session-2' })]),
      });

      await repo.revokeAllForUser('user-1');

      expect(inner.revokeAllForUser).toHaveBeenCalledWith('user-1');
      expect(await sessionBlocklist.isRevoked('session-1')).toBe(true);
      expect(await sessionBlocklist.isRevoked('session-2')).toBe(true);
    });
  });

  it('leaves non-revoking operations as plain pass-throughs', async () => {
    const session = makeSession({ id: 'session-1' });
    const { repo, inner, sessionBlocklist } = makeRepo({
      findById: vi.fn().mockResolvedValue(session),
    });

    await expect(repo.findById('session-1')).resolves.toEqual(session);
    await repo.touch('session-1', new Date());

    expect(inner.touch).toHaveBeenCalled();
    expect(await sessionBlocklist.isRevoked('session-1')).toBe(false);
  });
});
