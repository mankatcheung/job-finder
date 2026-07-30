import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserResolver } from '#src/interface-adapters/resolvers/UserResolver.js';
import type { IRequestEmailChangeUseCase } from '#src/use-cases/user/IRequestEmailChangeUseCase.js';
import type { IConfirmEmailChangeUseCase } from '#src/use-cases/user/IConfirmEmailChangeUseCase.js';
import type { IUpdatePasswordUseCase } from '#src/use-cases/user/IUpdatePasswordUseCase.js';
import type { IDeleteAccountUseCase } from '#src/use-cases/user/IDeleteAccountUseCase.js';
import type { IExportUserDataUseCase } from '#src/use-cases/user/IExportUserDataUseCase.js';
import type { IGenerateTotpSecretUseCase } from '#src/use-cases/user/IGenerateTotpSecretUseCase.js';
import type { IConfirmTotpSetupUseCase } from '#src/use-cases/user/IConfirmTotpSetupUseCase.js';
import type { IDisableTotpUseCase } from '#src/use-cases/user/IDisableTotpUseCase.js';
import type { IGetTotpStatusUseCase } from '#src/use-cases/user/IGetTotpStatusUseCase.js';
import type { ISaveLlmApiKeyUseCase } from '#src/use-cases/user/ISaveLlmApiKeyUseCase.js';
import type { IClearLlmApiKeyUseCase } from '#src/use-cases/user/IClearLlmApiKeyUseCase.js';
import type { IGetLlmKeyStatusUseCase } from '#src/use-cases/user/IGetLlmKeyStatusUseCase.js';
import type { IImportUserDataUseCase } from '#src/use-cases/user/IImportUserDataUseCase.js';
import type { IGetNotificationPreferencesUseCase } from '#src/use-cases/user/IGetNotificationPreferencesUseCase.js';
import type { IUpdateNotificationPreferencesUseCase } from '#src/use-cases/user/IUpdateNotificationPreferencesUseCase.js';
import type { IUpdateProfileUseCase } from '#src/use-cases/user/IUpdateProfileUseCase.js';
import type { IGetUserUseCase } from '#src/use-cases/user/IGetUserUseCase.js';
import type { IRequestAvatarUploadUrlUseCase } from '#src/use-cases/user/IRequestAvatarUploadUrlUseCase.js';
import type { IConfirmAvatarUseCase } from '#src/use-cases/user/IConfirmAvatarUseCase.js';
import type { IRemoveAvatarUseCase } from '#src/use-cases/user/IRemoveAvatarUseCase.js';
import { UserMapper } from '#src/interface-adapters/mappers/UserMapper.js';
import { makeUser, makeStorageProvider } from '#src/__tests__/helpers/mocks.js';

const stub = <T>(methods: Partial<T>): T => methods as T;

const makeDeps = (overrides?: object) => ({
  requestEmailChangeUseCase: stub<IRequestEmailChangeUseCase>({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
  confirmEmailChangeUseCase: stub<IConfirmEmailChangeUseCase>({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
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
  saveLlmApiKeyUseCase: stub<ISaveLlmApiKeyUseCase>({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
  clearLlmApiKeyUseCase: stub<IClearLlmApiKeyUseCase>({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
  getLlmKeyStatusUseCase: stub<IGetLlmKeyStatusUseCase>({ execute: vi.fn() }),
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
  requestAvatarUploadUrlUseCase: stub<IRequestAvatarUploadUrlUseCase>({ execute: vi.fn() }),
  confirmAvatarUseCase: stub<IConfirmAvatarUseCase>({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
  removeAvatarUseCase: stub<IRemoveAvatarUseCase>({
    execute: vi.fn().mockResolvedValue(undefined),
  }),
  storageProvider: makeStorageProvider({
    getSignedUrl: vi.fn().mockResolvedValue('https://cdn.example.com/signed-url'),
  }),
  userMapper: new UserMapper(),
  ...overrides,
});

describe('UserResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestEmailChange', () => {
    it('delegates to requestEmailChangeUseCase with the correct arguments', async () => {
      const deps = makeDeps();
      const resolver = new UserResolver(deps);

      await resolver.requestEmailChange('user-1', 'oldPass', 'new@example.com');

      expect(deps.requestEmailChangeUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        currentPassword: 'oldPass',
        newEmail: 'new@example.com',
      });
    });

    it('propagates errors from the use case', async () => {
      const err = Object.assign(new Error('CONFLICT'), { code: 'CONFLICT' });
      const deps = makeDeps({
        requestEmailChangeUseCase: stub<IRequestEmailChangeUseCase>({
          execute: vi.fn().mockRejectedValue(err),
        }),
      });

      await expect(
        new UserResolver(deps).requestEmailChange('user-1', 'pass', 'taken@example.com'),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });
  });

  describe('confirmEmailChange', () => {
    it('delegates to confirmEmailChangeUseCase with the token', async () => {
      const deps = makeDeps();
      const resolver = new UserResolver(deps);

      await resolver.confirmEmailChange('raw-token');

      expect(deps.confirmEmailChangeUseCase.execute).toHaveBeenCalledWith({
        token: 'raw-token',
      });
    });

    it('propagates errors from the use case', async () => {
      const err = Object.assign(new Error('UNAUTHORIZED'), { code: 'UNAUTHORIZED' });
      const deps = makeDeps({
        confirmEmailChangeUseCase: stub<IConfirmEmailChangeUseCase>({
          execute: vi.fn().mockRejectedValue(err),
        }),
      });

      await expect(new UserResolver(deps).confirmEmailChange('bad-token')).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
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

      const result = await new UserResolver(deps).beginTotpSetup('user-1', 'secret123');

      expect(deps.generateTotpSecretUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        password: 'secret123',
      });
      expect(result).toEqual(setup);
    });
  });

  describe('confirmTotpSetup', () => {
    it('delegates to confirmTotpSetupUseCase and returns the result', async () => {
      const output = { backupCodes: ['aaaa1111bbbb2222'] };
      const deps = makeDeps({
        confirmTotpSetupUseCase: stub<IConfirmTotpSetupUseCase>({
          execute: vi.fn().mockResolvedValue(output),
        }),
      });

      const result = await new UserResolver(deps).confirmTotpSetup('user-1', '123456');

      expect(deps.confirmTotpSetupUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        code: '123456',
      });
      expect(result).toEqual(output);
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

  describe('saveLlmApiKey', () => {
    it('delegates to saveLlmApiKeyUseCase with the correct arguments', async () => {
      const deps = makeDeps();

      await new UserResolver(deps).saveLlmApiKey('user-1', 'openrouter', 'sk-123');

      expect(deps.saveLlmApiKeyUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        provider: 'openrouter',
        apiKey: 'sk-123',
      });
    });
  });

  describe('clearLlmApiKey', () => {
    it('delegates to clearLlmApiKeyUseCase', async () => {
      const deps = makeDeps();

      await new UserResolver(deps).clearLlmApiKey('user-1');

      expect(deps.clearLlmApiKeyUseCase.execute).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getLlmKeyStatus', () => {
    it('delegates to getLlmKeyStatusUseCase and returns the result', async () => {
      const status = { configured: true, provider: 'openrouter' };
      const deps = makeDeps({
        getLlmKeyStatusUseCase: stub<IGetLlmKeyStatusUseCase>({
          execute: vi.fn().mockResolvedValue(status),
        }),
      });

      const result = await new UserResolver(deps).getLlmKeyStatus('user-1');

      expect(deps.getLlmKeyStatusUseCase.execute).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(status);
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
    it('delegates to getUserUseCase and maps the result, with no avatarUrl when avatarKey is unset', async () => {
      const user = makeUser({ id: 'user-1', avatarKey: null });
      const deps = makeDeps({
        getUserUseCase: stub<IGetUserUseCase>({ execute: vi.fn().mockResolvedValue(user) }),
      });

      const result = await new UserResolver(deps).getMe('user-1');

      expect(deps.getUserUseCase.execute).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(
        expect.objectContaining({ id: 'user-1', email: user.email, avatarUrl: null }),
      );
      expect(deps.storageProvider.getSignedUrl).not.toHaveBeenCalled();
    });

    it('resolves avatarKey to a signed avatarUrl when set', async () => {
      const user = makeUser({ id: 'user-1', avatarKey: 'users/user-1/avatar/key.png' });
      const deps = makeDeps({
        getUserUseCase: stub<IGetUserUseCase>({ execute: vi.fn().mockResolvedValue(user) }),
      });

      const result = await new UserResolver(deps).getMe('user-1');

      expect(deps.storageProvider.getSignedUrl).toHaveBeenCalledWith('users/user-1/avatar/key.png');
      expect(result?.avatarUrl).toBe('https://cdn.example.com/signed-url');
    });

    it('returns null when the use case returns null', async () => {
      const deps = makeDeps({
        getUserUseCase: stub<IGetUserUseCase>({ execute: vi.fn().mockResolvedValue(null) }),
      });

      const result = await new UserResolver(deps).getMe('missing');

      expect(result).toBeNull();
    });
  });

  describe('requestAvatarUploadUrl', () => {
    it('delegates to requestAvatarUploadUrlUseCase and returns the result', async () => {
      const payload = { uploadUrl: 'https://r2.example.com/upload', storageKey: 'key.png' };
      const deps = makeDeps({
        requestAvatarUploadUrlUseCase: stub<IRequestAvatarUploadUrlUseCase>({
          execute: vi.fn().mockResolvedValue(payload),
        }),
      });

      const result = await new UserResolver(deps).requestAvatarUploadUrl(
        'user-1',
        'me.png',
        'image/png',
      );

      expect(deps.requestAvatarUploadUrlUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        filename: 'me.png',
        mimeType: 'image/png',
      });
      expect(result).toEqual(payload);
    });
  });

  describe('confirmAvatar', () => {
    it('delegates to confirmAvatarUseCase and returns the resolved signed URL', async () => {
      const deps = makeDeps();

      const result = await new UserResolver(deps).confirmAvatar(
        'user-1',
        'users/user-1/avatar/key.png',
        'image/png',
        12345,
      );

      expect(deps.confirmAvatarUseCase.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        storageKey: 'users/user-1/avatar/key.png',
        mimeType: 'image/png',
        sizeBytes: 12345,
      });
      expect(deps.storageProvider.getSignedUrl).toHaveBeenCalledWith('users/user-1/avatar/key.png');
      expect(result).toBe('https://cdn.example.com/signed-url');
    });
  });

  describe('removeAvatar', () => {
    it('delegates to removeAvatarUseCase with the correct user id', async () => {
      const deps = makeDeps();

      await new UserResolver(deps).removeAvatar('user-1');

      expect(deps.removeAvatarUseCase.execute).toHaveBeenCalledWith('user-1');
    });
  });
});
