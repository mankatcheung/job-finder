import { describe, it, expect, vi } from 'vitest';
import { SendFollowUpRemindersUseCase } from '@/use-cases/reminders/SendFollowUpRemindersUseCase.js';
import {
  makeApplicationRepository,
  makeUserRepository,
  makeApplication,
  makeUser,
} from '@/__tests__/helpers/mocks.js';
import type { IEmailService } from '@/use-cases/ports/IEmailService.js';

const makeEmailService = (overrides?: Partial<IEmailService>): IEmailService => ({
  sendFollowUpReminder: vi.fn().mockResolvedValue(undefined),
  sendWeeklyDigest: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('SendFollowUpRemindersUseCase', () => {
  it('sends email and updates reminderSentAt for due applications', async () => {
    const followUpAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
    const app = makeApplication({ followUpAt });
    const user = makeUser();
    const applicationRepository = makeApplicationRepository({
      findDueForReminder: vi.fn().mockResolvedValue([app]),
      updateReminderSentAt: vi.fn().mockResolvedValue(undefined),
    });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
    });
    const emailService = makeEmailService();

    const useCase = new SendFollowUpRemindersUseCase({
      applicationRepository,
      userRepository,
      emailService,
    });
    await useCase.execute();

    expect(emailService.sendFollowUpReminder).toHaveBeenCalledWith(
      user.email,
      app.company,
      app.role,
      followUpAt,
    );
    expect(applicationRepository.updateReminderSentAt).toHaveBeenCalledWith(
      app.id,
      expect.any(Date),
    );
  });

  it('skips applications when user is not found', async () => {
    const app = makeApplication({ followUpAt: new Date() });
    const applicationRepository = makeApplicationRepository({
      findDueForReminder: vi.fn().mockResolvedValue([app]),
      updateReminderSentAt: vi.fn(),
    });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const emailService = makeEmailService();

    await new SendFollowUpRemindersUseCase({
      applicationRepository,
      userRepository,
      emailService,
    }).execute();

    expect(emailService.sendFollowUpReminder).not.toHaveBeenCalled();
    expect(applicationRepository.updateReminderSentAt).not.toHaveBeenCalled();
  });

  it('continues past individual email failures without throwing', async () => {
    const apps = [
      makeApplication({ id: 'app-1', followUpAt: new Date() }),
      makeApplication({ id: 'app-2', followUpAt: new Date() }),
    ];
    const user = makeUser();
    const applicationRepository = makeApplicationRepository({
      findDueForReminder: vi.fn().mockResolvedValue(apps),
      updateReminderSentAt: vi.fn().mockResolvedValue(undefined),
    });
    const userRepository = makeUserRepository({
      findById: vi.fn().mockResolvedValue(user),
    });
    const emailService = makeEmailService({
      sendFollowUpReminder: vi
        .fn()
        .mockRejectedValueOnce(new Error('Brevo timeout'))
        .mockResolvedValueOnce(undefined),
    });

    await expect(
      new SendFollowUpRemindersUseCase({
        applicationRepository,
        userRepository,
        emailService,
      }).execute(),
    ).resolves.not.toThrow();

    expect(emailService.sendFollowUpReminder).toHaveBeenCalledTimes(2);
    // Only the second app (which succeeded) should have reminderSentAt updated
    expect(applicationRepository.updateReminderSentAt).toHaveBeenCalledTimes(1);
    expect(applicationRepository.updateReminderSentAt).toHaveBeenCalledWith(
      'app-2',
      expect.any(Date),
    );
  });
});
