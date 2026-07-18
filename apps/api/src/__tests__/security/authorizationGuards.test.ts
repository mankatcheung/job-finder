/**
 * Authorization and security boundary tests.
 *
 * These tests verify that all state-mutating operations require valid authentication
 * (correct password) and that unauthorized attempts are rejected with UNAUTHORIZED,
 * never silently succeed or leak data.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { UpdateEmailUseCase } from '@/use-cases/user/UpdateEmailUseCase.js';
import { UpdatePasswordUseCase } from '@/use-cases/user/UpdatePasswordUseCase.js';
import { DeleteAccountUseCase } from '@/use-cases/user/DeleteAccountUseCase.js';
import { makeUserRepository, makeUser } from '@/__tests__/helpers/mocks.js';

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

const WRONG_PW = false as never;
const RIGHT_PW = true as never;

describe('Authorization guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('all protected mutations reject missing users with NOT_FOUND', () => {
    const notFound = makeUserRepository({ findById: vi.fn().mockResolvedValue(null) });

    it('UpdateEmailUseCase', async () => {
      const err = await new UpdateEmailUseCase({ userRepository: notFound })
        .execute({ userId: 'x', currentPassword: 'p', newEmail: 'e@e.com' })
        .catch((e) => e);
      expect((err as { code: string }).code).toBe('NOT_FOUND');
    });

    it('UpdatePasswordUseCase', async () => {
      const err = await new UpdatePasswordUseCase({ userRepository: notFound })
        .execute({ userId: 'x', currentPassword: 'p', newPassword: 'np' })
        .catch((e) => e);
      expect((err as { code: string }).code).toBe('NOT_FOUND');
    });

    it('DeleteAccountUseCase', async () => {
      const err = await new DeleteAccountUseCase({ userRepository: notFound })
        .execute({ userId: 'x', password: 'p' })
        .catch((e) => e);
      expect((err as { code: string }).code).toBe('NOT_FOUND');
    });
  });

  describe('all protected mutations reject wrong password with UNAUTHORIZED', () => {
    const user = makeUser();
    const repo = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });

    beforeEach(() => {
      vi.mocked(bcrypt.compare).mockResolvedValue(WRONG_PW);
    });

    it('UpdateEmailUseCase does not update on wrong password', async () => {
      const err = await new UpdateEmailUseCase({ userRepository: repo })
        .execute({ userId: 'user-1', currentPassword: 'wrong', newEmail: 'e@e.com' })
        .catch((e) => e);

      expect((err as { code: string }).code).toBe('UNAUTHORIZED');
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('UpdatePasswordUseCase does not hash or update on wrong password', async () => {
      const err = await new UpdatePasswordUseCase({ userRepository: repo })
        .execute({ userId: 'user-1', currentPassword: 'wrong', newPassword: 'new' })
        .catch((e) => e);

      expect((err as { code: string }).code).toBe('UNAUTHORIZED');
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('DeleteAccountUseCase does not delete on wrong password', async () => {
      const err = await new DeleteAccountUseCase({ userRepository: repo })
        .execute({ userId: 'user-1', password: 'wrong' })
        .catch((e) => e);

      expect((err as { code: string }).code).toBe('UNAUTHORIZED');
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });

  describe('all protected mutations proceed on correct password', () => {
    it('UpdateEmailUseCase calls update on correct password', async () => {
      const user = makeUser();
      const repo = makeUserRepository({
        findById: vi.fn().mockResolvedValue(user),
        findByEmail: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue(user),
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(RIGHT_PW);

      await expect(
        new UpdateEmailUseCase({ userRepository: repo }).execute({
          userId: 'user-1',
          currentPassword: 'correct',
          newEmail: 'new@example.com',
        }),
      ).resolves.toBeUndefined();
      expect(repo.update).toHaveBeenCalledOnce();
    });

    it('DeleteAccountUseCase calls delete on correct password', async () => {
      const user = makeUser();
      const repo = makeUserRepository({
        findById: vi.fn().mockResolvedValue(user),
        delete: vi.fn().mockResolvedValue(undefined),
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(RIGHT_PW);

      await expect(
        new DeleteAccountUseCase({ userRepository: repo }).execute({
          userId: 'user-1',
          password: 'correct',
        }),
      ).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('user-1');
    });
  });
});
