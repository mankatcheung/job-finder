import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateTotpSecretUseCase } from '@/use-cases/user/GenerateTotpSecretUseCase.js';
import { makeUserRepository, makeUser } from '@/__tests__/helpers/mocks.js';

describe('GenerateTotpSecretUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NOT_FOUND when the user does not exist', async () => {
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(null) });

    const err = await new GenerateTotpSecretUseCase({ userRepository })
      .execute('missing')
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws CONFLICT when 2FA is already enabled', async () => {
    const user = makeUser({ totpEnabled: true });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });

    const err = await new GenerateTotpSecretUseCase({ userRepository })
      .execute('user-1')
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('CONFLICT');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('generates a secret, persists it (not yet enabled), and returns setup data', async () => {
    const user = makeUser({ id: 'user-1', email: 'test@example.com', totpEnabled: false });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });

    const result = await new GenerateTotpSecretUseCase({ userRepository }).execute('user-1');

    expect(result.secret).toMatch(/^[A-Z2-7]+$/); // base32
    expect(result.otpauthUrl).toMatch(/^otpauth:\/\/totp\//);
    expect(result.otpauthUrl).toContain(encodeURIComponent(user.email));
    expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(userRepository.update).toHaveBeenCalledWith('user-1', { totpSecret: result.secret });
  });
});
