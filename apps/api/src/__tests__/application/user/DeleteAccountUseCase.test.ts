import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { DeleteAccountUseCase } from '#src/use-cases/user/DeleteAccountUseCase.js';
import { makeUserRepository, makeUser } from '#src/__tests__/helpers/mocks.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe('DeleteAccountUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const input = { userId: 'user-1', password: 'secret123' };

  it('deletes the user when credentials are valid', async () => {
    const user = makeUser({ id: 'user-1' });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
      delete: vi.fn().mockResolvedValue(undefined),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await new DeleteAccountUseCase({ userRepository }).execute(input);

    expect(bcrypt.compare).toHaveBeenCalledWith(input.password, user.passwordHash);
    expect(userRepository.delete).toHaveBeenCalledWith('user-1');
  });

  it('throws NOT_FOUND when user does not exist', async () => {
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(null),
    });

    const err = await new DeleteAccountUseCase({ userRepository }).execute(input).catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when password is wrong', async () => {
    const user = makeUser({ id: 'user-1' });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const err = await new DeleteAccountUseCase({ userRepository }).execute(input).catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  describe('step-up freshness (JEF-44)', () => {
    it('throws STEP_UP_REQUIRED for a 2FA-enabled user with a stale session', async () => {
      const user = makeUser({ id: 'user-1', totpEnabled: true });
      const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const err = await new DeleteAccountUseCase({ userRepository })
        .execute({ ...input, authTime: Date.now() - 16 * 60 * 1000 })
        .catch((e) => e);

      expect((err as { code: string }).code).toBe('STEP_UP_REQUIRED');
      expect(userRepository.delete).not.toHaveBeenCalled();
    });

    it('succeeds for a 2FA-enabled user with a fresh session', async () => {
      const user = makeUser({ id: 'user-1', totpEnabled: true });
      const userRepository = makeUserRepository({
        findById: vi.fn().mockResolvedValue(user),
        delete: vi.fn().mockResolvedValue(undefined),
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await new DeleteAccountUseCase({ userRepository }).execute({
        ...input,
        authTime: Date.now(),
      });

      expect(userRepository.delete).toHaveBeenCalledWith('user-1');
    });

    it('does not require freshness for a non-2FA user, even with a stale/missing authTime', async () => {
      const user = makeUser({ id: 'user-1', totpEnabled: false });
      const userRepository = makeUserRepository({
        findById: vi.fn().mockResolvedValue(user),
        delete: vi.fn().mockResolvedValue(undefined),
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await new DeleteAccountUseCase({ userRepository }).execute({
        ...input,
        authTime: undefined,
      });

      expect(userRepository.delete).toHaveBeenCalledWith('user-1');
    });
  });
});
