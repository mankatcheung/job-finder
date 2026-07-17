import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUseCase } from '@/use-cases/auth/RegisterUseCase.js';
import { makeUserRepository, makeUser } from '@/__tests__/helpers/mocks.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-pw'),
    compare: vi.fn(),
  },
}));

describe('RegisterUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a new user and returns userId and email', async () => {
    const user = makeUser();
    const userRepository = makeUserRepository({
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(user),
    });
    const generateId = vi.fn().mockReturnValue('user-1');

    const useCase = new RegisterUseCase({ userRepository, generateId });
    const result = await useCase.execute({ email: 'test@example.com', password: 'password123' });

    expect(result).toEqual({ userId: 'user-1', email: 'test@example.com' });
    expect(userRepository.create).toHaveBeenCalledWith({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed-pw',
    });
  });

  it('uses generateId for the new user id', async () => {
    const userRepository = makeUserRepository({
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(makeUser({ id: 'custom-id' })),
    });
    const generateId = vi.fn().mockReturnValue('custom-id');

    const useCase = new RegisterUseCase({ userRepository, generateId });
    await useCase.execute({ email: 'test@example.com', password: 'pass' });

    expect(generateId).toHaveBeenCalledOnce();
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'custom-id' }),
    );
  });

  it('throws CONFLICT when email is already registered', async () => {
    const userRepository = makeUserRepository({
      findByEmail: vi.fn().mockResolvedValue(makeUser()),
    });

    const useCase = new RegisterUseCase({ userRepository, generateId: vi.fn() });
    const err = await useCase
      .execute({ email: 'test@example.com', password: 'pass' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('CONFLICT');
    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
