import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { LoginUseCase } from '@/use-cases/auth/LoginUseCase.js';
import { makeUserRepository, makeUser } from '@/__tests__/helpers/mocks.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe('LoginUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the user when credentials are valid', async () => {
    const user = makeUser();
    const userRepository = makeUserRepository({
      findByEmail: vi.fn().mockResolvedValue(user),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const useCase = new LoginUseCase({ userRepository });
    const result = await useCase.execute({ email: 'test@example.com', password: 'password123' });

    expect(result).toEqual(user);
    expect(vi.mocked(bcrypt.compare)).toHaveBeenCalledWith('password123', user.passwordHash);
  });

  it('throws UNAUTHORIZED when user is not found', async () => {
    const userRepository = makeUserRepository({
      findByEmail: vi.fn().mockResolvedValue(null),
    });

    const useCase = new LoginUseCase({ userRepository });
    const err = await useCase
      .execute({ email: 'nobody@example.com', password: 'pass' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    expect(vi.mocked(bcrypt.compare)).not.toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when password does not match', async () => {
    const userRepository = makeUserRepository({
      findByEmail: vi.fn().mockResolvedValue(makeUser()),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const useCase = new LoginUseCase({ userRepository });
    const err = await useCase
      .execute({ email: 'test@example.com', password: 'wrong' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
  });
});
