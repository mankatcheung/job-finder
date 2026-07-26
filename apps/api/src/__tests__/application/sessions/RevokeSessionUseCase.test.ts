import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RevokeSessionUseCase } from '#src/use-cases/sessions/RevokeSessionUseCase.js';
import { makeSessionRepository, makeSession } from '#src/__tests__/helpers/mocks.js';

describe('RevokeSessionUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NOT_FOUND when the session does not belong to the user', async () => {
    const sessionRepository = makeSessionRepository({
      findByIdAndUserId: vi.fn().mockResolvedValue(null),
    });

    const err = await new RevokeSessionUseCase({ sessionRepository })
      .execute('session-1', 'user-1')
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
    expect(sessionRepository.revoke).not.toHaveBeenCalled();
  });

  it('revokes the session when owned by the user', async () => {
    const session = makeSession({ id: 'session-1', userId: 'user-1' });
    const sessionRepository = makeSessionRepository({
      findByIdAndUserId: vi.fn().mockResolvedValue(session),
    });

    await new RevokeSessionUseCase({ sessionRepository }).execute('session-1', 'user-1');

    expect(sessionRepository.findByIdAndUserId).toHaveBeenCalledWith('session-1', 'user-1');
    expect(sessionRepository.revoke).toHaveBeenCalledWith('session-1');
  });
});
