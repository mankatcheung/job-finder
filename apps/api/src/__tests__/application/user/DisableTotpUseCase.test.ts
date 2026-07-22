import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { DisableTotpUseCase } from '@/use-cases/user/DisableTotpUseCase.js';
import { makeUserRepository, makeUser } from '@/__tests__/helpers/mocks.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe('DisableTotpUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const input = { userId: 'user-1', password: 'secret123' };

  it('throws NOT_FOUND when the user does not exist', async () => {
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(null) });

    const err = await new DisableTotpUseCase({ userRepository }).execute(input).catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws UNAUTHORIZED when the password is wrong', async () => {
    const user = makeUser({ totpEnabled: true, totpSecret: 'ABCD1234' });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const err = await new DisableTotpUseCase({ userRepository }).execute(input).catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('clears totpSecret and disables totpEnabled on correct password', async () => {
    const user = makeUser({ id: 'user-1', totpEnabled: true, totpSecret: 'ABCD1234' });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    await new DisableTotpUseCase({ userRepository }).execute(input);

    expect(userRepository.update).toHaveBeenCalledWith('user-1', {
      totpEnabled: false,
      totpSecret: null,
    });
  });
});
