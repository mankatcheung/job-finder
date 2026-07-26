import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateNotificationPreferencesUseCase } from '#src/use-cases/user/UpdateNotificationPreferencesUseCase.js';
import { makeUserRepository, makeUser } from '#src/__tests__/helpers/mocks.js';

describe('UpdateNotificationPreferencesUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws NOT_FOUND when the user does not exist', async () => {
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(null) });

    const err = await new UpdateNotificationPreferencesUseCase({ userRepository })
      .execute({ userId: 'missing', weeklyDigestEnabled: false })
      .catch((e) => e);

    expect((err as { code: string }).code).toBe('NOT_FOUND');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('updates the given preferences', async () => {
    const user = makeUser({ id: 'user-1' });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });

    await new UpdateNotificationPreferencesUseCase({ userRepository }).execute({
      userId: 'user-1',
      weeklyDigestEnabled: false,
      followUpRemindersEnabled: true,
    });

    expect(userRepository.update).toHaveBeenCalledWith('user-1', {
      weeklyDigestEnabled: false,
      followUpRemindersEnabled: true,
    });
  });

  it('leaves fields untouched when undefined', async () => {
    const user = makeUser({ id: 'user-1' });
    const userRepository = makeUserRepository({ findById: vi.fn().mockResolvedValue(user) });

    await new UpdateNotificationPreferencesUseCase({ userRepository }).execute({
      userId: 'user-1',
      weeklyDigestEnabled: false,
    });

    expect(userRepository.update).toHaveBeenCalledWith('user-1', {
      weeklyDigestEnabled: false,
      followUpRemindersEnabled: undefined,
    });
  });
});
