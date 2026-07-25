import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUseCase } from '@/use-cases/auth/RegisterUseCase.js';
import { makeUserRepository, makeUser } from '@/__tests__/helpers/mocks.js';
import type { ISendEmailVerificationUseCase } from '@/use-cases/auth/ISendEmailVerificationUseCase.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-pw'),
    compare: vi.fn(),
  },
}));

const makeSendEmailVerificationUseCase = (
  overrides?: Partial<ISendEmailVerificationUseCase>,
): ISendEmailVerificationUseCase => ({
  execute: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

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

    const useCase = new RegisterUseCase({
      userRepository,
      generateId,
      sendEmailVerificationUseCase: makeSendEmailVerificationUseCase(),
    });
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

    const useCase = new RegisterUseCase({
      userRepository,
      generateId,
      sendEmailVerificationUseCase: makeSendEmailVerificationUseCase(),
    });
    await useCase.execute({ email: 'test@example.com', password: 'password123' });

    expect(generateId).toHaveBeenCalledOnce();
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'custom-id' }),
    );
  });

  it('throws CONFLICT when email is already registered', async () => {
    const userRepository = makeUserRepository({
      findByEmail: vi.fn().mockResolvedValue(makeUser()),
    });

    const useCase = new RegisterUseCase({
      userRepository,
      generateId: vi.fn(),
      sendEmailVerificationUseCase: makeSendEmailVerificationUseCase(),
    });
    const err = await useCase
      .execute({ email: 'test@example.com', password: 'password123' })
      .catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect((err as { code: string }).code).toBe('CONFLICT');
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('throws VALIDATION when the password is too short', async () => {
    const userRepository = makeUserRepository({
      findByEmail: vi.fn().mockResolvedValue(null),
    });

    const useCase = new RegisterUseCase({
      userRepository,
      generateId: vi.fn(),
      sendEmailVerificationUseCase: makeSendEmailVerificationUseCase(),
    });
    const err = await useCase
      .execute({ email: 'test@example.com', password: 'short' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('VALIDATION');
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('sends an email verification for the new user', async () => {
    const user = makeUser({ id: 'user-1' });
    const userRepository = makeUserRepository({
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(user),
    });
    const sendEmailVerificationUseCase = makeSendEmailVerificationUseCase();

    const useCase = new RegisterUseCase({
      userRepository,
      generateId: vi.fn().mockReturnValue('user-1'),
      sendEmailVerificationUseCase,
    });
    await useCase.execute({ email: 'test@example.com', password: 'password123' });

    expect(sendEmailVerificationUseCase.execute).toHaveBeenCalledWith('user-1');
  });

  it('still returns successfully when sending the verification email fails', async () => {
    const user = makeUser({ id: 'user-1' });
    const userRepository = makeUserRepository({
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(user),
    });
    const sendEmailVerificationUseCase = makeSendEmailVerificationUseCase({
      execute: vi.fn().mockRejectedValue(new Error('Brevo is down')),
    });

    const useCase = new RegisterUseCase({
      userRepository,
      generateId: vi.fn().mockReturnValue('user-1'),
      sendEmailVerificationUseCase,
    });
    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual({ userId: 'user-1', email: 'test@example.com' });
  });
});
