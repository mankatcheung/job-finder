import { createHash } from 'crypto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { ResetPasswordUseCase } from '@/use-cases/auth/ResetPasswordUseCase.js';
import {
  makeUserRepository,
  makePasswordResetTokenRepository,
  makePasswordResetToken,
  makeSessionRepository,
} from '@/__tests__/helpers/mocks.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

const RAW_TOKEN = 'raw-reset-token';
const TOKEN_HASH = createHash('sha256').update(RAW_TOKEN).digest('hex');

const makeDeps = (overrides?: object) => ({
  userRepository: makeUserRepository(),
  passwordResetTokenRepository: makePasswordResetTokenRepository(),
  sessionRepository: makeSessionRepository(),
  ...overrides,
});

describe('ResetPasswordUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws VALIDATION when the new password is too short', async () => {
    const userRepository = makeUserRepository();

    const err = await new ResetPasswordUseCase(makeDeps({ userRepository }))
      .execute({ token: RAW_TOKEN, newPassword: 'short1' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when no token matches the hash', async () => {
    const passwordResetTokenRepository = makePasswordResetTokenRepository({
      findByTokenHash: vi.fn().mockResolvedValue(null),
    });
    const userRepository = makeUserRepository();

    const err = await new ResetPasswordUseCase(
      makeDeps({ userRepository, passwordResetTokenRepository }),
    )
      .execute({ token: RAW_TOKEN, newPassword: 'newPassword123' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when the token was already used', async () => {
    const resetToken = makePasswordResetToken({
      tokenHash: TOKEN_HASH,
      usedAt: new Date('2024-01-01T00:30:00.000Z'),
    });
    const passwordResetTokenRepository = makePasswordResetTokenRepository({
      findByTokenHash: vi.fn().mockResolvedValue(resetToken),
    });
    const userRepository = makeUserRepository();

    const err = await new ResetPasswordUseCase(
      makeDeps({ userRepository, passwordResetTokenRepository }),
    )
      .execute({ token: RAW_TOKEN, newPassword: 'newPassword123' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when the token has expired', async () => {
    const resetToken = makePasswordResetToken({
      tokenHash: TOKEN_HASH,
      expiresAt: new Date(Date.now() - 1000),
    });
    const passwordResetTokenRepository = makePasswordResetTokenRepository({
      findByTokenHash: vi.fn().mockResolvedValue(resetToken),
    });
    const userRepository = makeUserRepository();

    const err = await new ResetPasswordUseCase(
      makeDeps({ userRepository, passwordResetTokenRepository }),
    )
      .execute({ token: RAW_TOKEN, newPassword: 'newPassword123' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('updates the password, marks the token used, and revokes all sessions for a valid token', async () => {
    const resetToken = makePasswordResetToken({
      id: 'reset-1',
      userId: 'user-1',
      tokenHash: TOKEN_HASH,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    const passwordResetTokenRepository = makePasswordResetTokenRepository({
      findByTokenHash: vi.fn().mockResolvedValue(resetToken),
    });
    const userRepository = makeUserRepository();
    const sessionRepository = makeSessionRepository();
    vi.mocked(bcrypt.hash).mockResolvedValue('new-hashed-password' as never);

    await new ResetPasswordUseCase(
      makeDeps({ userRepository, passwordResetTokenRepository, sessionRepository }),
    ).execute({
      token: RAW_TOKEN,
      newPassword: 'newPassword123',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
    expect(userRepository.update).toHaveBeenCalledWith('user-1', {
      passwordHash: 'new-hashed-password',
    });
    expect(passwordResetTokenRepository.markUsed).toHaveBeenCalledWith('reset-1');
    expect(sessionRepository.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });
});
