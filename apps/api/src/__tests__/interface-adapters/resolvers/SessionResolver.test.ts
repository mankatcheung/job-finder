import { describe, it, expect, vi } from 'vitest';
import { SessionResolver } from '#src/interface-adapters/resolvers/SessionResolver.js';
import { SessionMapper } from '#src/interface-adapters/mappers/SessionMapper.js';
import type { ListSessionsUseCase } from '#src/use-cases/sessions/ListSessionsUseCase.js';
import type { RevokeSessionUseCase } from '#src/use-cases/sessions/RevokeSessionUseCase.js';
import type { RevokeOtherSessionsUseCase } from '#src/use-cases/sessions/RevokeOtherSessionsUseCase.js';
import type { Session } from '#src/domain/session/Session.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeSession = (overrides?: Partial<Session>): Session => ({
  id: 'session-1',
  userId: 'user-1',
  userAgent: 'Mozilla/5.0',
  ipAddress: '127.0.0.1',
  deviceLabel: null,
  location: null,
  expiresAt: new Date('2024-02-01T00:00:00.000Z'),
  revokedAt: null,
  lastUsedAt: new Date('2024-01-01T00:00:00.000Z'),
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  currentRefreshTokenId: 'refresh-token-1',
  previousRefreshTokenId: null,
  previousRotatedAt: null,
  ...overrides,
});

const makeDeps = (overrides?: object) => ({
  listSessionsUseCase: stub<ListSessionsUseCase>({ execute: vi.fn() }),
  revokeSessionUseCase: stub<RevokeSessionUseCase>({ execute: vi.fn() }),
  revokeOtherSessionsUseCase: stub<RevokeOtherSessionsUseCase>({ execute: vi.fn() }),
  sessionMapper: new SessionMapper(),
  ...overrides,
});

describe('SessionResolver', () => {
  it('listSessions: maps each session to a DTO, flagging the current one', async () => {
    const sessions = [makeSession({ id: 'session-1' }), makeSession({ id: 'session-2' })];
    const deps = makeDeps({
      listSessionsUseCase: stub<ListSessionsUseCase>({
        execute: vi.fn().mockResolvedValue(sessions),
      }),
    });

    const resolver = new SessionResolver(deps);
    const result = await resolver.listSessions('user-1', 'session-2');

    expect(deps.listSessionsUseCase.execute).toHaveBeenCalledWith('user-1');
    expect(result).toHaveLength(2);
    expect(result[0].current).toBe(false);
    expect(result[1].current).toBe(true);
  });

  it('listSessions: marks none current when there is no active session id', async () => {
    const sessions = [makeSession({ id: 'session-1' })];
    const deps = makeDeps({
      listSessionsUseCase: stub<ListSessionsUseCase>({
        execute: vi.fn().mockResolvedValue(sessions),
      }),
    });

    const resolver = new SessionResolver(deps);
    const result = await resolver.listSessions('user-1', undefined);

    expect(result[0].current).toBe(false);
  });

  it('revokeSession: revokes and returns true', async () => {
    const deps = makeDeps({
      revokeSessionUseCase: stub<RevokeSessionUseCase>({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const resolver = new SessionResolver(deps);
    const result = await resolver.revokeSession('user-1', 'session-1', '1.2.3.4', 'Mozilla/5.0');

    expect(deps.revokeSessionUseCase.execute).toHaveBeenCalledWith(
      'session-1',
      'user-1',
      '1.2.3.4',
      'Mozilla/5.0',
    );
    expect(result).toBe(true);
  });

  it('revokeOtherSessions: revokes all but the current session and returns true', async () => {
    const deps = makeDeps({
      revokeOtherSessionsUseCase: stub<RevokeOtherSessionsUseCase>({
        execute: vi.fn().mockResolvedValue(undefined),
      }),
    });

    const resolver = new SessionResolver(deps);
    const result = await resolver.revokeOtherSessions(
      'user-1',
      'session-1',
      '1.2.3.4',
      'Mozilla/5.0',
    );

    expect(deps.revokeOtherSessionsUseCase.execute).toHaveBeenCalledWith(
      'user-1',
      'session-1',
      '1.2.3.4',
      'Mozilla/5.0',
    );
    expect(result).toBe(true);
  });
});
