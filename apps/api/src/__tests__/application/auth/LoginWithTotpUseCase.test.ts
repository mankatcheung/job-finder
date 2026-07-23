import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { LoginWithTotpUseCase } from '@/use-cases/auth/LoginWithTotpUseCase.js';
import { createTotp } from '@/infrastructure/auth/totp.js';
import {
  makeUserRepository,
  makeUser,
  makeTotpBackupCodeRepository,
  makeTotpBackupCode,
  makeRateLimiter,
} from '@/__tests__/helpers/mocks.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('@/infrastructure/auth/totpSecretCrypto.js', () => ({
  encryptTotpSecret: (secret: string) => `encrypted:${secret}`,
  decryptTotpSecret: (secret: string) => secret.replace(/^encrypted:/, ''),
}));

describe('LoginWithTotpUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const input = {
    email: 'test@example.com',
    password: 'password123',
    code: '123456',
    ipAddress: '127.0.0.1',
  };

  it('throws UNAUTHORIZED when the user does not exist', async () => {
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(null) });
    const totpBackupCodeRepository = makeTotpBackupCodeRepository();
    const totpRateLimiter = makeRateLimiter();

    const err = await new LoginWithTotpUseCase({
      userRepository,
      totpBackupCodeRepository,
      totpRateLimiter,
    })
      .execute(input)
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
  });

  it('throws UNAUTHORIZED when the password is wrong', async () => {
    const user = makeUser({ totpEnabled: true, totpSecret: 'encrypted:ABCD1234' });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    const totpBackupCodeRepository = makeTotpBackupCodeRepository();
    const totpRateLimiter = makeRateLimiter();
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const err = await new LoginWithTotpUseCase({
      userRepository,
      totpBackupCodeRepository,
      totpRateLimiter,
    })
      .execute(input)
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
  });

  it('throws UNAUTHORIZED when 2FA is not enabled for the user', async () => {
    const user = makeUser({ totpEnabled: false, totpSecret: null });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    const totpBackupCodeRepository = makeTotpBackupCodeRepository();
    const totpRateLimiter = makeRateLimiter();
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const err = await new LoginWithTotpUseCase({
      userRepository,
      totpBackupCodeRepository,
      totpRateLimiter,
    })
      .execute(input)
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
  });

  it('throws RATE_LIMITED when too many verification attempts have been made', async () => {
    const secret = createTotp().generateSecret();
    const user = makeUser({ totpEnabled: true, totpSecret: `encrypted:${secret}` });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    const totpBackupCodeRepository = makeTotpBackupCodeRepository();
    const totpRateLimiter = makeRateLimiter({ consume: vi.fn().mockReturnValue(false) });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const err = await new LoginWithTotpUseCase({
      userRepository,
      totpBackupCodeRepository,
      totpRateLimiter,
    })
      .execute(input)
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('RATE_LIMITED');
  });

  it('throws UNAUTHORIZED for an invalid code with no matching backup code', async () => {
    const secret = createTotp().generateSecret();
    const user = makeUser({ totpEnabled: true, totpSecret: `encrypted:${secret}` });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    const totpBackupCodeRepository = makeTotpBackupCodeRepository();
    const totpRateLimiter = makeRateLimiter();
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const err = await new LoginWithTotpUseCase({
      userRepository,
      totpBackupCodeRepository,
      totpRateLimiter,
    })
      .execute({ ...input, code: '000000' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
  });

  it('returns the user for valid credentials and a valid code', async () => {
    const secret = createTotp().generateSecret();
    const validCode = await createTotp({ secret }).generate();
    const user = makeUser({ totpEnabled: true, totpSecret: `encrypted:${secret}` });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    const totpBackupCodeRepository = makeTotpBackupCodeRepository();
    const totpRateLimiter = makeRateLimiter();
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await new LoginWithTotpUseCase({
      userRepository,
      totpBackupCodeRepository,
      totpRateLimiter,
    }).execute({
      ...input,
      code: validCode,
    });

    expect(result).toEqual(user);
  });

  it('accepts a valid, unused backup code as a fallback and marks it used', async () => {
    const secret = createTotp().generateSecret();
    const user = makeUser({ id: 'user-1', totpEnabled: true, totpSecret: `encrypted:${secret}` });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    const rawBackupCode = 'a1b2c3d4e5f60718';
    const codeHash = createHash('sha256').update(rawBackupCode).digest('hex');
    const backupCode = makeTotpBackupCode({ id: 'backup-1', userId: 'user-1', codeHash });
    const totpBackupCodeRepository = makeTotpBackupCodeRepository({
      findByCodeHash: vi.fn().mockResolvedValue(backupCode),
    });
    const totpRateLimiter = makeRateLimiter();
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await new LoginWithTotpUseCase({
      userRepository,
      totpBackupCodeRepository,
      totpRateLimiter,
    }).execute({ ...input, code: rawBackupCode });

    expect(result).toEqual(user);
    expect(totpBackupCodeRepository.markUsed).toHaveBeenCalledWith('backup-1');
  });

  it('rejects an already-used backup code', async () => {
    const secret = createTotp().generateSecret();
    const user = makeUser({ id: 'user-1', totpEnabled: true, totpSecret: `encrypted:${secret}` });
    const userRepository = makeUserRepository({ findByEmail: vi.fn().mockResolvedValue(user) });
    const rawBackupCode = 'a1b2c3d4e5f60718';
    const codeHash = createHash('sha256').update(rawBackupCode).digest('hex');
    const backupCode = makeTotpBackupCode({
      id: 'backup-1',
      userId: 'user-1',
      codeHash,
      usedAt: new Date('2024-01-01T00:00:00.000Z'),
    });
    const totpBackupCodeRepository = makeTotpBackupCodeRepository({
      findByCodeHash: vi.fn().mockResolvedValue(backupCode),
    });
    const totpRateLimiter = makeRateLimiter();
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const err = await new LoginWithTotpUseCase({
      userRepository,
      totpBackupCodeRepository,
      totpRateLimiter,
    })
      .execute({ ...input, code: rawBackupCode })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    expect(totpBackupCodeRepository.markUsed).not.toHaveBeenCalled();
  });
});
