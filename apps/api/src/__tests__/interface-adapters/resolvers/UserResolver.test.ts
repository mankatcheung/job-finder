import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserResolver } from '@/interface-adapters/resolvers/UserResolver.js';
import type { IUpdateEmailUseCase } from '@/use-cases/user/IUpdateEmailUseCase.js';
import type { IUpdatePasswordUseCase } from '@/use-cases/user/IUpdatePasswordUseCase.js';
import type { IDeleteAccountUseCase } from '@/use-cases/user/IDeleteAccountUseCase.js';
import type { IExportUserDataUseCase } from '@/use-cases/user/IExportUserDataUseCase.js';
import type { IGenerateTotpSecretUseCase } from '@/use-cases/user/IGenerateTotpSecretUseCase.js';
import type { IConfirmTotpSetupUseCase } from '@/use-cases/user/IConfirmTotpSetupUseCase.js';
import type { IDisableTotpUseCase } from '@/use-cases/user/IDisableTotpUseCase.js';
import type { IGetTotpStatusUseCase } from '@/use-cases/user/IGetTotpStatusUseCase.js';
import type { IImportUserDataUseCase } from '@/use-cases/user/IImportUserDataUseCase.js';
import type { IGetNotificationPreferencesUseCase } from '@/use-cases/user/IGetNotificationPreferencesUseCase.js';
import type { IUpdateNotificationPreferencesUseCase } from '@/use-cases/user/IUpdateNotificationPreferencesUseCase.js';
import type { IUpdateProfileUseCase } from '@/use-cases/user/IUpdateProfileUseCase.js';
import type { IGetUserUseCase } from '@/use-cases/user/IGetUserUseCase.js';
import { makeUser } from '@/__tests__/helpers/mocks.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeDeps = (overrides?: object) => ({
  updateEmailUseCase: stub<IUpdateEmailUseCase>({ execute: vi.fn().mockResolvedValue(undefined) }),
  updatePasswordUseCase: stub<IUpdatePasswordUseCase>({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
  deleteAccountUseCase: stub<IDeleteAccountUseCase>({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
  exportUserDataUseCase: stub<IExportUserDataUseCase>({ execute: vi.fn() }),
  generateTotpSecretUseCase: stub<IGenerateTotpSecretUseCase>({ execute: vi.fn() }),
  confirmTotpSetupUseCase: stub<IConfirmTotpSetupUseCase>({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
  disableTotpUseCase: stub<IDisableTotpUseCase>({ execute: vi.fn().mockResolvedValue(undefined) }),
  getTotpStatusUseCase: stub<IGetTotpStatusUseCase>({ execute: vi.fn() }),
  importUserDataUseCase: stub<IImportUserDataUseCase>({ execute: vi.fn() }),
  getNotificationPreferencesUseCase: stub<IGetNotificationPreferencesUseCase>({
    execute: vi.fn(),
  }),
  updateNotificationPreferencesUseCase: stub<IUpdateNotificationPreferencesUseCase>({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
  updateProfileUseCase: stub<IUpdateProfileUseCase>({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
  getUserUseCase: stub<IGetUserUseCase>({ execute: vi.fn() }),
  ...overrides,
});

describe('UserResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateEmail', () => {
    it('delegates to updateEmailUseCase with the correct arguments', async () => {
      const deps = makeDeps();
      const resolver = new UserResolver(deps);

      await resolver.updateEmail('user-1', 'oldPass', 'new@example.com');

      expect(deps.updateEmailUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        currentPassword: 'oldPass',
        newEmail: 'new@example.com',
      });
    });

    it('propagates errors from the use case', async () => {
      const err = Object.assign(new Error('CONFLICT'), { code: 'CONFLICT' });
      const deps = makeDeps({
        updateEmailUseCase: stub<IUpdateEmailUseCase>({
          execute: vi.fn().mockRejectedValue(err),
        }),
      });

      await expect(
        new UserResolver(deps).updateEmail('user-1', 'pass', 'taken@example.com'),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });

  describe('updatePassword', () => {
    it('delegates to updatePasswordUseCase with the correct arguments', async () => {
      const deps = makeDeps();
      const resolver = new UserResolver(deps);

      await resolver.updatePassword('user-1', 'oldPass', 'newPass');

      expect(deps.updatePasswordUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        currentPassword: 'oldPass',
        newPassword: 'newPass',
      });
    });
  });

  describe('deleteAccount', () => {
    it('delegates to deleteAccountUseCase with the correct arguments', async () => {
      const deps = makeDeps();
      const resolver = new UserResolver(deps);

      await resolver.deleteAccount('user-1', 'secret');

      expect(deps.deleteAccountUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        password: 'secret',
      });
    });
  });

  describe('exportUserData', () => {
    it('delegates to exportUserDataUseCase and returns the result', async () => {
      const exportData = {
        exportedAt: '2024-01-01T00:00:00.000Z',
        user: { email: 'test@example.com', createdAt: '2024-01-01T00:00:00.000Z' },
        applications: [],
      };
      const deps = makeDeps({
        exportUserDataUseCase: stub<IExportUserDataUseCase>({
          execute: vi.fn().mockResolvedValue(exportData),
        }),
      });

      const result = await new UserResolver(deps).exportUserData('user-1');

      expect(deps.exportUserDataUseCase.execute).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(exportData);
    });
  });

  describe('beginTotpSetup', () => {
    it('delegates to generateTotpSecretUseCase and returns the result', async () => {
      const setup = {
        secret: 'ABCD1234',
        otpauthUrl: 'otpauth://totp/...',
        qrCodeDataUrl: 'data:image/png;base64,...',
      };
      const deps = makeDeps({
        generateTotpSecretUseCase: stub<IGenerateTotpSecretUseCase>({
          execute: vi.fn().mockResolvedValue(setup),
        }),
      });

      const result = await new UserResolver(deps).beginTotpSetup('user-1');

      expect(deps.generateTotpSecretUseCase.execute).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(setup);
    });
  });

  describe('confirmTotpSetup', () => {
    it('delegates to confirmTotpSetupUseCase with the correct arguments', async () => {
      const deps = makeDeps();

      await new UserResolver(deps).confirmTotpSetup('user-1', '123456');

      expect(deps.confirmTotpSetupUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        code: '123456',
      });
    });

    it('propagates errors from the use case', async () => {
      const err = Object.assign(new Error('Invalid verification code'), { code: 'UNAUTHORIZED' });
      const deps = makeDeps({
        confirmTotpSetupUseCase: stub<IConfirmTotpSetupUseCase>({
          execute: vi.fn().mockRejectedValue(err),
        }),
      });

      await expect(
        new UserResolver(deps).confirmTotpSetup('user-1', 'bad-code'),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
  });

  describe('disableTotp', () => {
    it('delegates to disableTotpUseCase with the correct arguments', async () => {
      const deps = makeDeps();

      await new UserResolver(deps).disableTotp('user-1', 'secret');

      expect(deps.disableTotpUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        password: 'secret',
      });
    });
  });

  describe('getTotpStatus', () => {
    it('delegates to getTotpStatusUseCase and returns the result', async () => {
      const deps = makeDeps({
        getTotpStatusUseCase: stub<IGetTotpStatusUseCase>({
          execute: vi.fn().mockResolvedValue(true),
        }),
      });

      const result = await new UserResolver(deps).getTotpStatus('user-1');

      expect(deps.getTotpStatusUseCase.execute).toHaveBeenCalledWith('user-1');
      expect(result).toBe(true);
    });
  });

  describe('importUserData', () => {
    it('delegates to importUserDataUseCase and returns the summary', async () => {
      const summary = {
        applicationsImported: 2,
        applicationsSkipped: 1,
        notesImported: 3,
        documentsSkipped: 1,
      };
      const deps = makeDeps({
        importUserDataUseCase: stub<IImportUserDataUseCase>({
          execute: vi.fn().mockResolvedValue(summary),
        }),
      });

      const result = await new UserResolver(deps).importUserData('user-1', '{"applications":[]}');

      expect(deps.importUserDataUseCase.execute).toHaveBeenCalledWith(
        'user-1',
        '{"applications":[]}',
      );
      expect(result).toEqual(summary);
    });

    it('propagates errors from the use case', async () => {
      const err = Object.assign(new Error('Import file is not valid JSON'), {
        code: 'VALIDATION',
      });
      const deps = makeDeps({
        importUserDataUseCase: stub<IImportUserDataUseCase>({
          execute: vi.fn().mockRejectedValue(err),
        }),
      });

      await expect(
        new UserResolver(deps).importUserData('user-1', 'not json'),
      ).rejects.toMatchObject({ code: 'VALIDATION' });
    });
  });

  describe('getNotificationPreferences', () => {
    it('delegates to getNotificationPreferencesUseCase and returns the result', async () => {
      const prefs = { weeklyDigestEnabled: true, followUpRemindersEnabled: false };
      const deps = makeDeps({
        getNotificationPreferencesUseCase: stub<IGetNotificationPreferencesUseCase>({
          execute: vi.fn().mockResolvedValue(prefs),
        }),
      });

      const result = await new UserResolver(deps).getNotificationPreferences('user-1');

      expect(deps.getNotificationPreferencesUseCase.execute).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(prefs);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('delegates to updateNotificationPreferencesUseCase with the correct arguments', async () => {
      const deps = makeDeps();

      await new UserResolver(deps).updateNotificationPreferences('user-1', false, true);

      expect(deps.updateNotificationPreferencesUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        weeklyDigestEnabled: false,
        followUpRemindersEnabled: true,
      });
    });
  });

  describe('updateProfile', () => {
    it('delegates to updateProfileUseCase with the correct arguments', async () => {
      const deps = makeDeps();
      const resolver = new UserResolver(deps);

      await resolver.updateProfile('user-1', 'Jeff', 'UTC', 'Staff Engineer');

      expect(deps.updateProfileUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        name: 'Jeff',
        timezone: 'UTC',
        targetRole: 'Staff Engineer',
      });
    });

    it('propagates errors from the use case', async () => {
      const err = Object.assign(new Error('VALIDATION'), { code: 'VALIDATION' });
      const deps = makeDeps({
        updateProfileUseCase: stub<IUpdateProfileUseCase>({
          execute: vi.fn().mockRejectedValue(err),
        }),
      });

      await expect(
        new UserResolver(deps).updateProfile('user-1', undefined, 'Not/A_Zone', undefined),
      ).rejects.toMatchObject({ code: 'VALIDATION' });
    });
  });

  describe('getMe', () => {
    it('delegates to getUserUseCase and returns the result', async () => {
      const user = makeUser({ id: 'user-1' });
      const deps = makeDeps({
        getUserUseCase: stub<IGetUserUseCase>({ execute: vi.fn().mockResolvedValue(user) }),
      });

      const result = await new UserResolver(deps).getMe('user-1');

      expect(deps.getUserUseCase.execute).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(user);
    });

    it('returns null when the use case returns null', async () => {
      const deps = makeDeps({
        getUserUseCase: stub<IGetUserUseCase>({ execute: vi.fn().mockResolvedValue(null) }),
      });

      const result = await new UserResolver(deps).getMe('missing');

      expect(result).toBeNull();
    });
  });
});
