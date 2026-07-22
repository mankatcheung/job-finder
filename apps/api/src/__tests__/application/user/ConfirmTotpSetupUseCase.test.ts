import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmTotpSetupUseCase } from '@/use-cases/user/ConfirmTotpSetupUseCase.js';
import { createTotp } from '@/infrastructure/auth/totp.js';
import { makeUserRepository, makeUser } from '@/__tests__/helpers/mocks.js';

describe('ConfirmTotpSetupUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NOT_FOUND when the user does not exist', async () => {
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(null) });

    const err = await new ConfirmTotpSetupUseCase({ userRepository })
      .execute({ userId: 'missing', code: '123456' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws CONFLICT when 2FA is already enabled', async () => {
    const user = makeUser({ totpEnabled: true, totpSecret: 'ABCD1234' });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });

    const err = await new ConfirmTotpSetupUseCase({ userRepository })
      .execute({ userId: 'user-1', code: '123456' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('CONFLICT');
  });

  it('throws CONFLICT when no setup is in progress', async () => {
    const user = makeUser({ totpEnabled: false, totpSecret: null });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });

    const err = await new ConfirmTotpSetupUseCase({ userRepository })
      .execute({ userId: 'user-1', code: '123456' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('CONFLICT');
  });

  it('throws UNAUTHORIZED for an invalid code', async () => {
    const user = makeUser({
      totpEnabled: false,
      totpSecret: createTotp().generateSecret(),
    });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });

    const err = await new ConfirmTotpSetupUseCase({ userRepository })
      .execute({ userId: 'user-1', code: '000000' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('enables 2FA when given a valid code', async () => {
    const secret = createTotp().generateSecret();
    const validCode = await createTotp({ secret }).generate();
    const user = makeUser({ id: 'user-1', totpEnabled: false, totpSecret: secret });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });

    await new ConfirmTotpSetupUseCase({ userRepository }).execute({
      userId: 'user-1',
      code: validCode,
    });

    expect(userRepository.update).toHaveBeenCalledWith('user-1', { totpEnabled: true });
  });
});
