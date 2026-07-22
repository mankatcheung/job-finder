import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestPasswordResetUseCase } from '@/use-cases/auth/RequestPasswordResetUseCase.js';
import {
  makeUserRepository,
  makePasswordResetTokenRepository,
  makeUser,
} from '@/__tests__/helpers/mocks.js';
import type { IEmailService } from '@/use-cases/ports/IEmailService.js';

const makeEmailService = (overrides?: Partial<IEmailService>): IEmailService => ({
  sendFollowUpReminder: vi.fn().mockResolvedValue(undefined),
  sendWeeklyDigest: vi.fn().mockResolvedValue(undefined),
  sendPasswordReset: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeDeps = (overrides?: object) => ({
  userRepository: makeUserRepository(),
  passwordResetTokenRepository: makePasswordResetTokenRepository(),
  emailService: makeEmailService(),
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
    ).execute({ email: 'nobody@example.com' });

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
    ).execute({ email: 'test@example.com' });

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
    ).execute({ email: 'test@example.com' });
    const after = Date.now();

    const createCall = vi.mocked(passwordResetTokenRepository.create).mock.calls[0][0];
    const expiresAtMs = createCall.expiresAt.getTime();
    expect(expiresAtMs).toBeGreaterThanOrEqual(before + 60 * 60 * 1000 - 1000);
    expect(expiresAtMs).toBeLessThanOrEqual(after + 60 * 60 * 1000 + 1000);
  });
});
