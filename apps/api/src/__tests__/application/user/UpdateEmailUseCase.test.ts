import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { UpdateEmailUseCase } from '@/use-cases/user/UpdateEmailUseCase.js';
import { makeUserRepository, makeUser } from '@/__tests__/helpers/mocks.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

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

    await new UpdateEmailUseCase({ userRepository }).execute(input);

    expect(userRepository.findById).toHaveBeenCalledWith('user-1');
    expect(bcrypt.compare).toHaveBeenCalledWith(input.currentPassword, user.passwordHash);
    expect(userRepository.findByEmail).toHaveBeenCalledWith(input.newEmail);
    expect(userRepository.update).toHaveBeenCalledWith('user-1', { email: input.newEmail });
  });

  it('throws NOT_FOUND when user does not exist', async () => {
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const err = await new UpdateEmailUseCase({ userRepository }).execute(input).catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when password is wrong', async () => {
    const user = makeUser({ id: 'user-1' });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const err = await new UpdateEmailUseCase({ userRepository }).execute(input).catch((e) => e);

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

    const err = await new UpdateEmailUseCase({ userRepository }).execute(input).catch((e) => e);

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
      new UpdateEmailUseCase({ userRepository }).execute(input),
    ).resolves.toBeUndefined();
    expect(userRepository.update).toHaveBeenCalled();
  });
});
