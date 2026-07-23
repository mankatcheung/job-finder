import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserResolver } from '@/interface-adapters/resolvers/UserResolver.js';
import type { IUpdateEmailUseCase } from '@/use-cases/user/IUpdateEmailUseCase.js';
import type { IUpdatePasswordUseCase } from '@/use-cases/user/IUpdatePasswordUseCase.js';
import type { IDeleteAccountUseCase } from '@/use-cases/user/IDeleteAccountUseCase.js';
import type { IExportUserDataUseCase } from '@/use-cases/user/IExportUserDataUseCase.js';
import type { IImportUserDataUseCase } from '@/use-cases/user/IImportUserDataUseCase.js';

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
  importUserDataUseCase: stub<IImportUserDataUseCase>({ execute: vi.fn() }),
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
});
