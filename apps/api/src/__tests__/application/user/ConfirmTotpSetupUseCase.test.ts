import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmTotpSetupUseCase } from '@/use-cases/user/ConfirmTotpSetupUseCase.js';
import { createTotp } from '@/infrastructure/auth/totp.js';
import {
  makeUserRepository,
  makeUser,
  makeTotpBackupCodeRepository,
} from '@/__tests__/helpers/mocks.js';

vi.mock('@/infrastructure/auth/totpSecretCrypto.js', () => ({
  encryptTotpSecret: (secret: string) => `encrypted:${secret}`,
  decryptTotpSecret: (secret: string) => secret.replace(/^encrypted:/, ''),
}));

describe('ConfirmTotpSetupUseCase', () => {
  const generateId = vi.fn(() => 'backup-code-id');

  beforeEach(() => {
    vi.clearAllMocks();
    generateId.mockReturnValue('backup-code-id');
  });

  it('throws NOT_FOUND when the user does not exist', async () => {
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(null) });
    const totpBackupCodeRepository = makeTotpBackupCodeRepository();

    const err = await new ConfirmTotpSetupUseCase({
      userRepository,
      totpBackupCodeRepository,
      generateId,
    })
      .execute({ userId: 'missing', code: '123456' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
  });

  it('throws CONFLICT when 2FA is already enabled', async () => {
    const user = makeUser({ totpEnabled: true, totpSecret: 'encrypted:ABCD1234' });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });
    const totpBackupCodeRepository = makeTotpBackupCodeRepository();

    const err = await new ConfirmTotpSetupUseCase({
      userRepository,
      totpBackupCodeRepository,
      generateId,
    })
      .execute({ userId: 'user-1', code: '123456' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('CONFLICT');
  });

  it('throws CONFLICT when no setup is in progress', async () => {
    const user = makeUser({ totpEnabled: false, totpSecret: null });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });
    const totpBackupCodeRepository = makeTotpBackupCodeRepository();

    const err = await new ConfirmTotpSetupUseCase({
      userRepository,
      totpBackupCodeRepository,
      generateId,
    })
      .execute({ userId: 'user-1', code: '123456' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('CONFLICT');
  });

  it('throws UNAUTHORIZED for an invalid code', async () => {
    const secret = createTotp().generateSecret();
    const user = makeUser({
      totpEnabled: false,
      totpSecret: `encrypted:${secret}`,
    });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });
    const totpBackupCodeRepository = makeTotpBackupCodeRepository();

    const err = await new ConfirmTotpSetupUseCase({
      userRepository,
      totpBackupCodeRepository,
      generateId,
    })
      .execute({ userId: 'user-1', code: '000000' })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('UNAUTHORIZED');
    expect(userRepository.update).not.toHaveBeenCalled();
    expect(totpBackupCodeRepository.create).not.toHaveBeenCalled();
  });

  it('enables 2FA and issues backup codes when given a valid code', async () => {
    const secret = createTotp().generateSecret();
    const validCode = await createTotp({ secret }).generate();
    const user = makeUser({ id: 'user-1', totpEnabled: false, totpSecret: `encrypted:${secret}` });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });
    const totpBackupCodeRepository = makeTotpBackupCodeRepository();

    const result = await new ConfirmTotpSetupUseCase({
      userRepository,
      totpBackupCodeRepository,
      generateId,
    }).execute({
      userId: 'user-1',
      code: validCode,
    });

    expect(userRepository.update).toHaveBeenCalledWith('user-1', { totpEnabled: true });
    expect(result.backupCodes).toHaveLength(10);
    expect(new Set(result.backupCodes).size).toBe(10); // all unique
    result.backupCodes.forEach((code) => expect(code).toMatch(/^[0-9a-f]{16}$/));
    expect(totpBackupCodeRepository.create).toHaveBeenCalledTimes(10);
    expect(totpBackupCodeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', id: 'backup-code-id' }),
    );
  });
});
