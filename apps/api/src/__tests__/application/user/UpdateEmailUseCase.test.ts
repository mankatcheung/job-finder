import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { UpdateEmailUseCase } from '@/use-cases/user/UpdateEmailUseCase.js';
import { makeUserRepository, makeUser } from '@/__tests__/helpers/mocks.js';
import type { ISendEmailVerificationUseCase } from '@/use-cases/auth/ISendEmailVerificationUseCase.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

const makeSendEmailVerificationUseCase = (
  overrides?: Partial<ISendEmailVerificationUseCase>,
): ISendEmailVerificationUseCase => ({
  execute: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('UpdateEmailUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const input = {
    userId: 'user-1',
    currentPassword: 'secret123',
    newEmail: 'new@example.com',
  };

  it('updates email when credentials are valid and email is available', async () => {
    const user = makeUser({ id: 'user-1', email: 'old@example.com' });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
      findByEmail: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({ ...user, email: input.newEmail }),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await new UpdateEmailUseCase({
      userRepository,
      sendEmailVerificationUseCase: makeSendEmailVerificationUseCase(),
    }).execute(input);

    expect(userRepository.findById).toHaveBeenCalledWith('user-1');
    expect(bcrypt.compare).toHaveBeenCalledWith(input.currentPassword, user.passwordHash);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(input.newEmail);
    expect(userRepository.update).toHaveBeenCalledWith('user-1', {
      email: input.newEmail,
      emailVerifiedAt: null,
    });
  });

  it('throws NOT_FOUND when user does not exist', async () => {
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const err = await new UpdateEmailUseCase({
      userRepository,
      sendEmailVerificationUseCase: makeSendEmailVerificationUseCase(),
    })
      .execute(input)
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when password is wrong', async () => {
    const user = makeUser({ id: 'user-1' });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const err = await new UpdateEmailUseCase({
      userRepository,
      sendEmailVerificationUseCase: makeSendEmailVerificationUseCase(),
    })
      .execute(input)
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('throws CONFLICT when new email is already taken by another user', async () => {
    const user = makeUser({ id: 'user-1' });
    const other = makeUser({ id: 'user-2', email: input.newEmail });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
      findByEmail: vi.fn().mockResolvedValue(other),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const err = await new UpdateEmailUseCase({
      userRepository,
      sendEmailVerificationUseCase: makeSendEmailVerificationUseCase(),
    })
      .execute(input)
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('CONFLICT');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('allows re-using the same email (no conflict when email belongs to the same user)', async () => {
    const user = makeUser({ id: 'user-1', email: input.newEmail });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
      findByEmail: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue(user),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await expect(
      new UpdateEmailUseCase({
        userRepository,
        sendEmailVerificationUseCase: makeSendEmailVerificationUseCase(),
      }).execute(input),
    ).resolves.toBeUndefined();
    expect(userRepository.update).toHaveBeenCalled();
  });

  it('sends a new verification email for the updated address', async () => {
    const user = makeUser({ id: 'user-1', email: 'old@example.com' });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
      findByEmail: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({ ...user, email: input.newEmail }),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const sendEmailVerificationUseCase = makeSendEmailVerificationUseCase();

    await new UpdateEmailUseCase({ userRepository, sendEmailVerificationUseCase }).execute(input);

    expect(sendEmailVerificationUseCase.execute).toHaveBeenCalledWith('user-1');
  });

  it('still succeeds when sending the verification email fails', async () => {
    const user = makeUser({ id: 'user-1', email: 'old@example.com' });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
      findByEmail: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({ ...user, email: input.newEmail }),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const sendEmailVerificationUseCase = makeSendEmailVerificationUseCase({
      execute: vi.fn().mockRejectedValue(new Error('Brevo is down')),
    });

    await expect(
      new UpdateEmailUseCase({ userRepository, sendEmailVerificationUseCase }).execute(input),
    ).resolves.toBeUndefined();
  });
});
