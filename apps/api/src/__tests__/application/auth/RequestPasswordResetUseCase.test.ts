import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestPasswordResetUseCase } from '#src/use-cases/auth/RequestPasswordResetUseCase.js';
import {
  makeUserRepository,
  makePasswordResetTokenRepository,
  makeUser,
  makeRateLimiter,
} from '#src/__tests__/helpers/mocks.js';
import type { IEmailService } from '#src/use-cases/ports/IEmailService.js';

const makeEmailService = (overrides?: Partial<IEmailService>): IEmailService => ({
  sendFollowUpReminder: vi.fn().mockResolvedValue(undefined),
  sendWeeklyDigest: vi.fn().mockResolvedValue(undefined),
  sendPasswordReset: vi.fn().mockResolvedValue(undefined),
  sendEmailVerification: vi.fn().mockResolvedValue(undefined),
  sendNewDeviceLoginAlert: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeDeps = (overrides?: object) => ({
  userRepository: makeUserRepository(),
  passwordResetTokenRepository: makePasswordResetTokenRepository(),
  emailService: makeEmailService(),
  passwordResetRateLimiter: makeRateLimiter(),
  generateId: vi.fn().mockReturnValue('generated-id'),
  webAppOrigin: 'http://localhost:3000',
  ...overrides,
});

describe('RequestPasswordResetUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('silently no-ops when the email does not match a user', async () => {
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(null) });
    const passwordResetTokenRepository = makePasswordResetTokenRepository();
    const emailService = makeEmailService();

    await new RequestPasswordResetUseCase(
      makeDeps({ userRepository, passwordResetTokenRepository, emailService }),
    ).execute({ email: 'nobody@example.com', ipAddress: '127.0.0.1' });

    expect(passwordResetTokenRepository.create).not.toHaveBeenCalled();
    expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('deletes existing tokens, creates a new one, and emails a reset link', async () => {
    const user = makeUser({ id: 'user-1', email: 'test@example.com' });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    const passwordResetTokenRepository = makePasswordResetTokenRepository();
    const emailService = makeEmailService();

    await new RequestPasswordResetUseCase(
      makeDeps({
        userRepository,
        passwordResetTokenRepository,
        emailService,
        webAppOrigin: 'https://app.jobfinder.com',
      }),
    ).execute({ email: 'test@example.com', ipAddress: '127.0.0.1' });

    expect(passwordResetTokenRepository.deleteAllForUser).toHaveBeenCalledWith('user-1');
    expect(passwordResetTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'generated-id', userId: 'user-1' }),
    );
    expect(emailService.sendPasswordReset).toHaveBeenCalledWith(
      'test@example.com',
      expect.stringMatching(/^https:\/\/app\.jobfinder\.com\/reset-password\?token=[a-f0-9]+$/),
    );
  });

  it('sets an expiry roughly one hour in the future', async () => {
    const user = makeUser({ id: 'user-1' });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    const passwordResetTokenRepository = makePasswordResetTokenRepository();

    const before = Date.now();
    await new RequestPasswordResetUseCase(
      makeDeps({ userRepository, passwordResetTokenRepository }),
    ).execute({ email: 'test@example.com', ipAddress: '127.0.0.1' });
    const after = Date.now();

    const createCall = vi.mocked(passwordResetTokenRepository.create).mock.calls[0][0];
    const expiresAtMs = createCall.expiresAt.getTime();
    expect(expiresAtMs).toBeGreaterThanOrEqual(before + 60 * 60 * 1000 - 1000);
    expect(expiresAtMs).toBeLessThanOrEqual(after + 60 * 60 * 1000 + 1000);
  });

  it('does not let an email-provider failure surface differently than the unknown-email no-op', async () => {
    const user = makeUser({ id: 'user-1', email: 'test@example.com' });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    const emailService = makeEmailService({
      sendPasswordReset: vi.fn().mockRejectedValue(new Error('Brevo API error 500')),
    });

    await expect(
      new RequestPasswordResetUseCase(makeDeps({ userRepository, emailService })).execute({
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
      }),
    ).resolves.toBeUndefined();
  });

  it('rate-limits by email address regardless of whether the account exists', async () => {
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(null) });
    const rateLimiter = makeRateLimiter({ consume: vi.fn().mockReturnValue(false) });

    const err = await new RequestPasswordResetUseCase(
      makeDeps({ userRepository, passwordResetRateLimiter: rateLimiter }),
    )
      .execute({ email: 'nobody@example.com', ipAddress: '127.0.0.1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('RATE_LIMITED');
    expect(rateLimiter.consume).toHaveBeenCalledWith('password-reset:email:nobody@example.com');
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('rate-limits by IP address in addition to email', async () => {
    const rateLimiter = makeRateLimiter({
      consume: vi.fn().mockImplementation((key: string) => !key.startsWith('password-reset:ip:')),
    });

    const err = await new RequestPasswordResetUseCase(
      makeDeps({ passwordResetRateLimiter: rateLimiter }),
    )
      .execute({ email: 'test@example.com', ipAddress: '203.0.113.5' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('RATE_LIMITED');
    expect(rateLimiter.consume).toHaveBeenCalledWith('password-reset:ip:203.0.113.5');
  });

  it('lowercases the email when building the rate-limit key', async () => {
    const rateLimiter = makeRateLimiter();
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(null) });

    await new RequestPasswordResetUseCase(
      makeDeps({ userRepository, passwordResetRateLimiter: rateLimiter }),
    ).execute({
      email: 'Test@Example.com',
      ipAddress: null,
    });

    expect(rateLimiter.consume).toHaveBeenCalledWith('password-reset:email:test@example.com');
  });
});
