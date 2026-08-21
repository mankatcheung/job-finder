import { describe, it, expect, vi } from 'vitest';
import { LoginOrSignupWithOAuthUseCase } from '#src/use-cases/oauth/LoginOrSignupWithOAuthUseCase.js';
import {
  makeUserRepository,
  makeUser,
  makeOAuthAccountRepository,
  makeOAuthAccount,
  makeOAuthProviderRegistry,
  makeOAuthProvider,
} from '#src/__tests__/helpers/mocks.js';

const input = {
  provider: 'google' as const,
  code: 'auth-code',
  redirectUri: 'https://api/cb',
  codeVerifier: 'test-verifier',
};

describe('LoginOrSignupWithOAuthUseCase', () => {
  it('logs in the existing user when the provider identity is already linked', async () => {
    const user = makeUser({ id: 'user-1' });
    const link = makeOAuthAccount({ userId: 'user-1' });
    const useCase = new LoginOrSignupWithOAuthUseCase({
      userRepository: makeUserRepository({ findById: vi.fn().mockResolvedValue(user) }),
      oauthAccountRepository: makeOAuthAccountRepository({
        findByProvider: vi.fn().mockResolvedValue(link),
      }),
      oauthProviderRegistry: makeOAuthProviderRegistry(),
      generateId: vi.fn(),
    });

    const result = await useCase.execute(input);

    expect(result).toEqual({ user, isNewUser: false });
  });

  it('throws NOT_FOUND when a linked account points at a missing user', async () => {
    const link = makeOAuthAccount({ userId: 'ghost' });
    const useCase = new LoginOrSignupWithOAuthUseCase({
      userRepository: makeUserRepository({ findById: vi.fn().mockResolvedValue(null) }),
      oauthAccountRepository: makeOAuthAccountRepository({
        findByProvider: vi.fn().mockResolvedValue(link),
      }),
      oauthProviderRegistry: makeOAuthProviderRegistry(),
      generateId: vi.fn(),
    });

    const err = await useCase.execute(input).catch((e) => e);
    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws VALIDATION when the provider does not report a verified email', async () => {
    const oauthProviderRegistry = makeOAuthProviderRegistry({
      get: vi.fn().mockReturnValue(
        makeOAuthProvider({
          exchangeCodeForProfile: vi.fn().mockResolvedValue({
            providerAccountId: 'sub-1',
            email: null,
            emailVerified: false,
            name: null,
          }),
        }),
      ),
    });
    const useCase = new LoginOrSignupWithOAuthUseCase({
      userRepository: makeUserRepository(),
      oauthAccountRepository: makeOAuthAccountRepository(),
      oauthProviderRegistry,
      generateId: vi.fn(),
    });

    const err = await useCase.execute(input).catch((e) => e);
    expect((err as { code: string }).code).toBe('VALIDATION');
  });

  it('throws CONFLICT instead of silently linking when the email already belongs to another account', async () => {
    const existingUser = makeUser({ id: 'user-1', email: 'test@example.com' });
    const useCase = new LoginOrSignupWithOAuthUseCase({
      userRepository: makeUserRepository({
        findByEmail: vi.fn().mockResolvedValue(existingUser),
      }),
      oauthAccountRepository: makeOAuthAccountRepository(),
      oauthProviderRegistry: makeOAuthProviderRegistry(),
      generateId: vi.fn(),
    });

    const err = await useCase.execute(input).catch((e) => e);
    expect((err as { code: string }).code).toBe('CONFLICT');
  });

  it('creates a new passwordless, pre-verified user and links the identity on first sign-in', async () => {
    const createdUser = makeUser({ id: 'new-user', passwordHash: null });
    const userRepository = makeUserRepository({
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(createdUser),
    });
    const oauthAccountRepository = makeOAuthAccountRepository();
    const useCase = new LoginOrSignupWithOAuthUseCase({
      userRepository,
      oauthAccountRepository,
      oauthProviderRegistry: makeOAuthProviderRegistry(),
      generateId: vi.fn().mockReturnValueOnce('new-user').mockReturnValueOnce('link-1'),
    });

    const result = await useCase.execute(input);

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'new-user',
        email: 'test@example.com',
        passwordHash: null,
        name: 'Jeff Man',
        emailVerifiedAt: expect.any(Date) as Date,
      }),
    );
    expect(oauthAccountRepository.create).toHaveBeenCalledWith({
      id: 'link-1',
      userId: 'new-user',
      provider: 'google',
      providerAccountId: 'google-sub-1',
      email: 'test@example.com',
    });
    expect(result).toEqual({ user: createdUser, isNewUser: true });
  });
});
