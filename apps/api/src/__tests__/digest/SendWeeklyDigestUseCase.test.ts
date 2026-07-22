import { describe, it, expect, vi } from 'vitest';
import { SendWeeklyDigestUseCase } from '@/use-cases/digest/SendWeeklyDigestUseCase.js';
import {
  makeUserRepository,
  makeApplicationRepository,
  makeUser,
  makeApplication,
} from '@/__tests__/helpers/mocks.js';
import type { IEmailService, WeeklyDigestData } from '@/use-cases/ports/IEmailService.js';

function makeEmailService(): IEmailService {
  return {
    sendFollowUpReminder: vi.fn().mockResolvedValue(undefined),
    sendWeeklyDigest: vi.fn().mockResolvedValue(undefined),
    sendEmailVerification: vi.fn().mockResolvedValue(undefined),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

describe('SendWeeklyDigestUseCase', () => {
  it('returns 0 sent when there are no users', async () => {
    const userRepository = makeUserRepository({ findAll: vi.fn().mockResolvedValue([]) });
    const applicationRepository = makeApplicationRepository();
    const emailService = makeEmailService();

    const result = await new SendWeeklyDigestUseCase({
      userRepository,
      applicationRepository,
      emailService,
    }).execute();

    expect(result).toEqual({ totalUsers: 0, sent: 0, skipped: 0 });
    expect(emailService.sendWeeklyDigest).not.toHaveBeenCalled();
  });

  it('skips users with no applications', async () => {
    const user = makeUser();
    const userRepository = makeUserRepository({ findAll: vi.fn().mockResolvedValue([user]) });
    const applicationRepository = makeApplicationRepository({
      findAllByUserId: vi.fn().mockResolvedValue([]),
    });
    const emailService = makeEmailService();

    const result = await new SendWeeklyDigestUseCase({
      userRepository,
      applicationRepository,
      emailService,
    }).execute();

    expect(result).toEqual({ totalUsers: 1, sent: 0, skipped: 1 });
    expect(emailService.sendWeeklyDigest).not.toHaveBeenCalled();
  });

  it('sends a digest for each user with applications', async () => {
    const userA = makeUser({ id: 'u1', email: 'a@test.com' });
    const userB = makeUser({ id: 'u2', email: 'b@test.com' });
    const userRepository = makeUserRepository({
      findAll: vi.fn().mockResolvedValue([userA, userB]),
    });
    const app = makeApplication({ userId: 'u1' });
    const applicationRepository = makeApplicationRepository({
      findAllByUserId: vi
        .fn()
        .mockImplementation((uid: string) =>
          uid === 'u1' ? Promise.resolve([app]) : Promise.resolve([]),
        ),
    });
    const emailService = makeEmailService();

    const result = await new SendWeeklyDigestUseCase({
      userRepository,
      applicationRepository,
      emailService,
    }).execute();

    expect(result).toEqual({ totalUsers: 2, sent: 1, skipped: 1 });
    expect(emailService.sendWeeklyDigest).toHaveBeenCalledOnce();
    expect(emailService.sendWeeklyDigest).toHaveBeenCalledWith('a@test.com', expect.any(Object));
  });

  it('categorises new applications created in the last 7 days', async () => {
    const user = makeUser();
    const userRepository = makeUserRepository({ findAll: vi.fn().mockResolvedValue([user]) });

    const recentApp = makeApplication({
      company: 'New Co',
      role: 'Engineer',
      createdAt: new Date(Date.now() - 2 * DAY_MS),
    });
    const oldApp = makeApplication({
      company: 'Old Co',
      role: 'Dev',
      createdAt: new Date(Date.now() - 10 * DAY_MS),
    });
    const applicationRepository = makeApplicationRepository({
      findAllByUserId: vi.fn().mockResolvedValue([recentApp, oldApp]),
    });
    const emailService = makeEmailService();

    await new SendWeeklyDigestUseCase({
      userRepository,
      applicationRepository,
      emailService,
    }).execute();

    const [, digestData] = (emailService.sendWeeklyDigest as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, WeeklyDigestData];
    expect(digestData.newThisWeek).toHaveLength(1);
    expect(digestData.newThisWeek[0].company).toBe('New Co');
    expect(digestData.totalApplications).toBe(2);
  });

  it('identifies overdue follow-ups', async () => {
    const user = makeUser();
    const userRepository = makeUserRepository({ findAll: vi.fn().mockResolvedValue([user]) });

    const overdueApp = makeApplication({
      company: 'Stripe',
      role: 'SWE',
      followUpAt: new Date(Date.now() - 2 * DAY_MS),
      status: 'applied',
    });
    const applicationRepository = makeApplicationRepository({
      findAllByUserId: vi.fn().mockResolvedValue([overdueApp]),
    });
    const emailService = makeEmailService();

    await new SendWeeklyDigestUseCase({
      userRepository,
      applicationRepository,
      emailService,
    }).execute();

    const [, digestData] = (emailService.sendWeeklyDigest as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, WeeklyDigestData];
    expect(digestData.overdueFollowUps).toHaveLength(1);
    expect(digestData.overdueFollowUps[0].company).toBe('Stripe');
  });

  it('does not mark rejected/accepted/withdrawn apps as overdue', async () => {
    const user = makeUser();
    const userRepository = makeUserRepository({ findAll: vi.fn().mockResolvedValue([user]) });

    const rejectedApp = makeApplication({
      followUpAt: new Date(Date.now() - 2 * DAY_MS),
      status: 'rejected',
    });
    const applicationRepository = makeApplicationRepository({
      findAllByUserId: vi.fn().mockResolvedValue([rejectedApp]),
    });
    const emailService = makeEmailService();

    await new SendWeeklyDigestUseCase({
      userRepository,
      applicationRepository,
      emailService,
    }).execute();

    const [, digestData] = (emailService.sendWeeklyDigest as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, WeeklyDigestData];
    expect(digestData.overdueFollowUps).toHaveLength(0);
  });

  it('includes correct status breakdown', async () => {
    const user = makeUser();
    const userRepository = makeUserRepository({ findAll: vi.fn().mockResolvedValue([user]) });

    const apps = [
      makeApplication({ status: 'applied' }),
      makeApplication({ status: 'applied' }),
      makeApplication({ status: 'interviewing' }),
    ];
    const applicationRepository = makeApplicationRepository({
      findAllByUserId: vi.fn().mockResolvedValue(apps),
    });
    const emailService = makeEmailService();

    await new SendWeeklyDigestUseCase({
      userRepository,
      applicationRepository,
      emailService,
    }).execute();

    const [, digestData] = (emailService.sendWeeklyDigest as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, WeeklyDigestData];
    expect(digestData.byStatus).toEqual({ applied: 2, interviewing: 1 });
  });
});
