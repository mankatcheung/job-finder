import type { IUserRepository } from '@/use-cases/ports/IUserRepository.js';
import type { IApplicationRepository } from '@/use-cases/ports/IApplicationRepository.js';
import type { IEmailService, WeeklyDigestData } from '@/use-cases/ports/IEmailService.js';
import { DURATIONS_MS } from '@/constants.js';

interface Deps {
  userRepository: IUserRepository;
  applicationRepository: IApplicationRepository;
  emailService: IEmailService;
}

export interface DigestSummary {
  totalUsers: number;
  sent: number;
  skipped: number;
}

const SEVEN_DAYS_MS = DURATIONS_MS.WEEK;

export class SendWeeklyDigestUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(): Promise<DigestSummary> {
    const users = await this.deps.userRepository.findAll();
    let sent = 0;
    let skipped = 0;

    await Promise.allSettled(
      users.map(async (user) => {
        if (!user.weeklyDigestEnabled) {
          skipped++;
          return;
        }

        const apps = await this.deps.applicationRepository.findAllByUserId(user.id);
        if (apps.length === 0) {
          skipped++;
          return;
        }

        const now = new Date();
        const weekAgo = new Date(now.getTime() - SEVEN_DAYS_MS);
        const nextWeek = new Date(now.getTime() + SEVEN_DAYS_MS);

        const byStatus: Record<string, number> = {};
        for (const app of apps) {
          byStatus[app.status] = (byStatus[app.status] ?? 0) + 1;
        }

        const newThisWeek = apps
          .filter((a) => a.createdAt >= weekAgo)
          .map((a) => ({ company: a.company, role: a.role }));

        const overdueFollowUps = apps
          .filter(
            (a) =>
              a.followUpAt != null &&
              a.followUpAt < now &&
              !['rejected', 'accepted', 'withdrawn'].includes(a.status),
          )
          .map((a) => ({ company: a.company, role: a.role, followUpAt: a.followUpAt! }));

        const upcomingFollowUps = apps
          .filter((a) => a.followUpAt != null && a.followUpAt >= now && a.followUpAt <= nextWeek)
          .map((a) => ({ company: a.company, role: a.role, followUpAt: a.followUpAt! }));

        const data: WeeklyDigestData = {
          totalApplications: apps.length,
          byStatus,
          newThisWeek,
          overdueFollowUps,
          upcomingFollowUps,
        };

        await this.deps.emailService.sendWeeklyDigest(user.email, data);
        sent++;
      }),
    );

    return { totalUsers: users.length, sent, skipped };
  }
}
