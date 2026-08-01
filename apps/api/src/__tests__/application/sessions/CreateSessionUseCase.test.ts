import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSessionUseCase } from '#src/use-cases/sessions/CreateSessionUseCase.js';
import {
  makeSessionRepository,
  makeSession,
  makeUserRepository,
} from '#src/__tests__/helpers/mocks.js';
import { SESSION } from '#src/constants.js';
import type { IDeviceLabeler } from '#src/use-cases/ports/IDeviceLabeler.js';
import type { IIpLocationResolver } from '#src/use-cases/ports/IIpLocationResolver.js';
import type { IEmailService } from '#src/use-cases/ports/IEmailService.js';

const makeDeviceLabeler = (overrides?: Partial<IDeviceLabeler>): IDeviceLabeler => ({
  describe: vi.fn().mockReturnValue('Chrome on macOS'),
  ...overrides,
});

const makeIpLocationResolver = (overrides?: Partial<IIpLocationResolver>): IIpLocationResolver => ({
  lookup: vi.fn().mockResolvedValue('San Francisco, United States'),
  ...overrides,
});

const makeEmailService = (overrides?: Partial<IEmailService>): IEmailService => ({
  sendFollowUpReminder: vi.fn().mockResolvedValue(undefined),
  sendWeeklyDigest: vi.fn().mockResolvedValue(undefined),
  sendPasswordReset: vi.fn().mockResolvedValue(undefined),
  sendEmailVerification: vi.fn().mockResolvedValue(undefined),
  sendNewDeviceLoginAlert: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeDeps = (overrides?: object) => ({
  sessionRepository: makeSessionRepository(),
  userRepository: makeUserRepository(),
  deviceLabeler: makeDeviceLabeler(),
  ipLocationResolver: makeIpLocationResolver(),
  emailService: makeEmailService(),
  generateId: vi.fn().mockReturnValue('generated-id'),
  ...overrides,
});

describe('CreateSessionUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a session with a generated id and device info', async () => {
    const sessionRepository = makeSessionRepository({
      create: vi.fn().mockResolvedValue(makeSession({ id: 'generated-id' })),
    });
    const generateId = vi.fn().mockReturnValue('generated-id');

    await new CreateSessionUseCase(makeDeps({ sessionRepository, generateId })).execute({
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
    await new CreateSessionUseCase(makeDeps({ sessionRepository, generateId })).execute({
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

  it('generates an initial currentRefreshTokenId for the new session', async () => {
    const sessionRepository = makeSessionRepository({
      create: vi.fn().mockResolvedValue(makeSession()),
    });
    const generateId = vi
      .fn()
      .mockReturnValueOnce('generated-session-id')
      .mockReturnValueOnce('generated-refresh-token-id');

    await new CreateSessionUseCase(makeDeps({ sessionRepository, generateId })).execute({
      userId: 'user-1',
      userAgent: null,
      ipAddress: null,
    });

    expect(sessionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'generated-session-id',
        currentRefreshTokenId: 'generated-refresh-token-id',
      }),
    );
  });

  it('returns the created session', async () => {
    const session = makeSession({ id: 'generated-id' });
    const sessionRepository = makeSessionRepository({ create: vi.fn().mockResolvedValue(session) });

    const result = await new CreateSessionUseCase(
      makeDeps({ sessionRepository, generateId: vi.fn().mockReturnValue('generated-id') }),
    ).execute({ userId: 'user-1', userAgent: null, ipAddress: null });

    expect(result).toEqual(session);
  });
});
