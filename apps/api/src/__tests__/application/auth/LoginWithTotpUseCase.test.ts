import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { LoginWithTotpUseCase } from '@/use-cases/auth/LoginWithTotpUseCase.js';
import { createTotp } from '@/infrastructure/auth/totp.js';
import { makeUserRepository, makeUser } from '@/__tests__/helpers/mocks.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe('LoginWithTotpUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const input = { email: 'test@example.com', password: 'password123', code: '123456' };

  it('throws UNAUTHORIZED when the user does not exist', async () => {
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(null) });

    const err = await new LoginWithTotpUseCase({ userRepository }).execute(input).catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
  });

  it('throws UNAUTHORIZED when the password is wrong', async () => {
    const user = makeUser({ totpEnabled: true, totpSecret: 'ABCD1234' });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const err = await new LoginWithTotpUseCase({ userRepository }).execute(input).catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
  });

  it('throws UNAUTHORIZED when 2FA is not enabled for the user', async () => {
    const user = makeUser({ totpEnabled: false, totpSecret: null });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const err = await new LoginWithTotpUseCase({ userRepository }).execute(input).catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
  });

  it('throws UNAUTHORIZED for an invalid code', async () => {
    const secret = createTotp().generateSecret();
    const user = makeUser({ totpEnabled: true, totpSecret: secret });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const err = await new LoginWithTotpUseCase({ userRepository })
      .execute({ ...input, code: '000000' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
  });

  it('returns the user for valid credentials and a valid code', async () => {
    const secret = createTotp().generateSecret();
    const validCode = await createTotp({ secret }).generate();
    const user = makeUser({ totpEnabled: true, totpSecret: secret });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await new LoginWithTotpUseCase({ userRepository }).execute({
      ...input,
      code: validCode,
    });

    expect(result).toEqual(user);
  });
});
