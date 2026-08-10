import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IActivityLogRepository } from '#src/use-cases/ports/IActivityLogRepository.js';
import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';

interface StatusChangePayload {
  from: ApplicationStatus;
  to: ApplicationStatus;
}

export interface StageDurationStat {
  status: ApplicationStatus;
  averageDays: number | null;
  medianDays: number | null;
  sampleSize: number;
}

export interface TimeToResponseStat {
  averageDays: number | null;
  medianDays: number | null;
  sampleSize: number;
}

export interface ResponseTimeAnalytics {
  timeInStage: StageDurationStat[];
  timeToFirstResponse: TimeToResponseStat;
}

interface Deps {
  applicationRepository: IApplicationRepository;
  activityLogRepository: IActivityLogRepository;
}

export interface GetResponseTimeAnalyticsInput {
  userId: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function parseStatusChangePayload(payload: string): StatusChangePayload | null {
  try {
    const parsed = JSON.parse(payload) as Partial<StatusChangePayload>;
    if (typeof parsed.from !== 'string' || typeof parsed.to !== 'string') return null;
    return { from: parsed.from as ApplicationStatus, to: parsed.to as ApplicationStatus };
  } catch {
    return null;
  }
}

/**
 * ActivityLog records a timestamped `status_changed` event on every stage
 * transition, and until now that history was only ever read one
 * application at a time (the activity feed) — never aggregated. This turns
 * it into two metrics: how long applications typically sit in each stage
 * before moving on, and how long it takes to hear back after applying.
 *
 * A stage's duration is only counted once an application has actually left
 * it — an application still sitting in its current stage contributes no
 * data point for that stage, since we don't know when (or whether) it will
 * exit next.
 *
 * Time-to-first-response is measured from `appliedAt` to the status_changed
 * event whose `from` is `applied` — the moment the application actually
 * moved — rather than simply the next log entry after `appliedAt`, since an
 * application can accumulate unrelated activity (notes, documents) before
 * its status moves again.
 */
export class GetResponseTimeAnalyticsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetResponseTimeAnalyticsInput): Promise<ResponseTimeAnalytics> {
    const [applications, logs] = await Promise.all([
      this.deps.applicationRepository.findAllByUserId(input.userId),
      this.deps.activityLogRepository.findAllByUserId(input.userId),
    ]);

    const statusChangesByApplicationId = new Map<
      string,
      (StatusChangePayload & { createdAt: Date })[]
    >();
    for (const log of logs) {
      if (log.eventType !== 'status_changed') continue;
      const parsed = parseStatusChangePayload(log.payload);
      if (!parsed) continue;
      const list = statusChangesByApplicationId.get(log.applicationId) ?? [];
      list.push({ createdAt: log.createdAt, ...parsed });
      statusChangesByApplicationId.set(log.applicationId, list);
    }
    for (const changes of statusChangesByApplicationId.values()) {
      changes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    const daysByStatus = new Map<ApplicationStatus, number[]>();
    const timeToFirstResponseDays: number[] = [];

    for (const application of applications) {
      const changes = statusChangesByApplicationId.get(application.id) ?? [];

      let segmentStart = application.createdAt;
      for (const change of changes) {
        const days = (change.createdAt.getTime() - segmentStart.getTime()) / MS_PER_DAY;
        const list = daysByStatus.get(change.from) ?? [];
        list.push(days);
        daysByStatus.set(change.from, list);
        segmentStart = change.createdAt;
      }

      if (application.appliedAt) {
        const exitFromApplied = changes.find((c) => c.from === 'applied');
        if (exitFromApplied) {
          const days =
            (exitFromApplied.createdAt.getTime() - application.appliedAt.getTime()) / MS_PER_DAY;
          timeToFirstResponseDays.push(days);
        }
      }
    }

    const timeInStage: StageDurationStat[] = Array.from(daysByStatus.entries())
      .map(([status, days]) => ({
        status,
        averageDays: average(days),
        medianDays: median(days),
        sampleSize: days.length,
      }))
      .sort((a, b) => b.sampleSize - a.sampleSize);

    return {
      timeInStage,
      timeToFirstResponse: {
        averageDays: average(timeToFirstResponseDays),
        medianDays: median(timeToFirstResponseDays),
        sampleSize: timeToFirstResponseDays.length,
      },
    };
  }
}
