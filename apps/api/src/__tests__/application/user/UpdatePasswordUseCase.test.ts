import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { UpdatePasswordUseCase } from '@/use-cases/user/UpdatePasswordUseCase.js';
import { makeUserRepository, makeUser } from '@/__tests__/helpers/mocks.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe('UpdatePasswordUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const input = {
    userId: 'user-1',
    currentPassword: 'oldSecret123',
    newPassword: 'newSecret456',
  };

  it('updates the password hash when credentials are valid', async () => {
    const user = makeUser({ id: 'user-1' });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue(user),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    vi.mocked(bcrypt.hash).mockResolvedValue('new-hash' as never);

    await new UpdatePasswordUseCase({ userRepository }).execute(input);

    expect(bcrypt.compare).toHaveBeenCalledWith(input.currentPassword, user.passwordHash);
    expect(bcrypt.hash).toHaveBeenCalledWith(input.newPassword, 12);
    expect(userRepository.update).toHaveBeenCalledWith('user-1', { passwordHash: 'new-hash' });
  });

  it('throws NOT_FOUND when user does not exist', async () => {
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const err = await new UpdatePasswordUseCase({ userRepository }).execute(input).catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when current password is wrong', async () => {
    const user = makeUser({ id: 'user-1' });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const err = await new UpdatePasswordUseCase({ userRepository }).execute(input).catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    expect(userRepository.update).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });
});
