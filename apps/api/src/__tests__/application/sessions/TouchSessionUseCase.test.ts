import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TouchSessionUseCase } from '@/use-cases/sessions/TouchSessionUseCase.js';
import { makeSessionRepository, makeSession } from '@/__tests__/helpers/mocks.js';

describe('TouchSessionUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws UNAUTHORIZED when the session does not exist', async () => {
    const sessionRepository = makeSessionRepository({ findById: vi.fn().mockResolvedValue(null) });

    const err = await new TouchSessionUseCase({ sessionRepository })
      .execute('missing')
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    expect(sessionRepository.touch).not.toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when the session has been revoked', async () => {
    const session = makeSession({ revokedAt: new Date() });
    const sessionRepository = makeSessionRepository({
      findById: vi.fn().mockResolvedValue(session),
    });

    const err = await new TouchSessionUseCase({ sessionRepository })
      .execute('session-1')
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    expect(sessionRepository.touch).not.toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when the session has expired', async () => {
    const session = makeSession({ expiresAt: new Date(Date.now() - 1000) });
    const sessionRepository = makeSessionRepository({
      findById: vi.fn().mockResolvedValue(session),
    });

    const err = await new TouchSessionUseCase({ sessionRepository })
      .execute('session-1')
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
  });

  it('updates lastUsedAt/expiresAt for a valid session', async () => {
    const session = makeSession({ id: 'session-1', expiresAt: new Date(Date.now() + 60_000) });
    const sessionRepository = makeSessionRepository({
      findById: vi.fn().mockResolvedValue(session),
    });

    await new TouchSessionUseCase({ sessionRepository }).execute('session-1');

    expect(sessionRepository.touch).toHaveBeenCalledWith('session-1', expect.any(Date));
  });
});
