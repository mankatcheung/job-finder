import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSessionUseCase } from '@/use-cases/sessions/CreateSessionUseCase.js';
import { makeSessionRepository, makeSession } from '@/__tests__/helpers/mocks.js';
import { SESSION } from '@/constants.js';

describe('CreateSessionUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a session with a generated id and device info', async () => {
    const sessionRepository = makeSessionRepository({
      create: vi.fn().mockResolvedValue(makeSession({ id: 'generated-id' })),
    });
    const generateId = vi.fn().mockReturnValue('generated-id');

    await new CreateSessionUseCase({ sessionRepository, generateId }).execute({
      userId: 'user-1',
      userAgent: 'Mozilla/5.0',
      ipAddress: '10.0.0.1',
    });

    expect(sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'generated-id',
        userId: 'user-1',
        userAgent: 'Mozilla/5.0',
        ipAddress: '10.0.0.1',
      }),
    );
  });

  it('sets expiresAt roughly SESSION.TTL_MS in the future', async () => {
    const sessionRepository = makeSessionRepository({
      create: vi.fn().mockResolvedValue(makeSession()),
    });
    const generateId = vi.fn().mockReturnValue('generated-id');

    const before = Date.now();
    await new CreateSessionUseCase({ sessionRepository, generateId }).execute({
      userId: 'user-1',
      userAgent: null,
      ipAddress: null,
    });
    const after = Date.now();

    const createCall = vi.mocked(sessionRepository.create).mock.calls[0][0];
    const expiresAtMs = createCall.expiresAt.getTime();
    expect(expiresAtMs).toBeGreaterThanOrEqual(before + SESSION.TTL_MS - 1000);
    expect(expiresAtMs).toBeLessThanOrEqual(after + SESSION.TTL_MS + 1000);
  });

  it('returns the created session', async () => {
    const session = makeSession({ id: 'generated-id' });
    const sessionRepository = makeSessionRepository({ create: vi.fn().mockResolvedValue(session) });

    const result = await new CreateSessionUseCase({
      sessionRepository,
      generateId: vi.fn().mockReturnValue('generated-id'),
    }).execute({ userId: 'user-1', userAgent: null, ipAddress: null });

    expect(result).toEqual(session);
  });
});
