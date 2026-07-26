import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RevokeOtherSessionsUseCase } from '#src/use-cases/sessions/RevokeOtherSessionsUseCase.js';
import { makeSessionRepository } from '#src/__tests__/helpers/mocks.js';

describe('RevokeOtherSessionsUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revokes all sessions for the user except the current one', async () => {
    const sessionRepository = makeSessionRepository();

    await new RevokeOtherSessionsUseCase({ sessionRepository }).execute('user-1', 'session-1');

    expect(sessionRepository.revokeAllForUserExcept).toHaveBeenCalledWith('user-1', 'session-1');
  });
});
