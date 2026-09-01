import { createHash } from 'crypto';
import type { IShareLinkRepository } from '#src/use-cases/ports/IShareLinkRepository.js';
import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IInterviewRoundRepository } from '#src/use-cases/ports/IInterviewRoundRepository.js';
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from '#src/domain/application/ApplicationStatus.js';
import { DURATIONS_MS } from '#src/use-cases/constants.js';

interface Deps {
  shareLinkRepository: IShareLinkRepository;
  applicationRepository: IApplicationRepository;
  interviewRoundRepository: IInterviewRoundRepository;
}

export interface StatusCount {
  status: ApplicationStatus;
  count: number;
}

export interface SharedSummary {
  statusCounts: StatusCount[];
  totalApplications: number;
  totalInterviews: number;
  upcomingInterviews: number;
  applicationsUpdatedLast7Days: number;
  generatedAt: Date;
}

export class GetSharedSummaryUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(rawToken: string): Promise<SharedSummary | null> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const link = await this.deps.shareLinkRepository.findByTokenHash(tokenHash);
    if (!link) return null;

    await this.deps.shareLinkRepository.updateLastUsed(link.id);

    const [applications, interviewRounds] = await Promise.all([
      this.deps.applicationRepository.findAllByUserId(link.userId),
      this.deps.interviewRoundRepository.findAllByUserId(link.userId),
    ]);

    const statusCounts: StatusCount[] = APPLICATION_STATUSES.map((status) => ({
      status,
      count: applications.filter((a) => a.status === status).length,
    }));

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - DURATIONS_MS.WEEK);
    const applicationsUpdatedLast7Days = applications.filter(
      (a) => a.updatedAt >= sevenDaysAgo,
    ).length;
    const upcomingInterviews = interviewRounds.filter(
      (r) => r.outcome === 'pending' && r.scheduledAt !== null && r.scheduledAt > now,
    ).length;

    return {
      statusCounts,
      totalApplications: applications.length,
      totalInterviews: interviewRounds.length,
      upcomingInterviews,
      applicationsUpdatedLast7Days,
      generatedAt: now,
    };
  }
}
