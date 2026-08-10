import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IInterviewRoundRepository } from '#src/use-cases/ports/IInterviewRoundRepository.js';
import type { InterviewRoundType } from '#src/domain/interviewRound/InterviewRound.js';

const INTERVIEW_ROUND_TYPES: readonly InterviewRoundType[] = [
  'phone',
  'technical',
  'onsite',
  'hr',
  'other',
];

export interface InterviewRoundTypeStat {
  type: InterviewRoundType;
  passed: number;
  failed: number;
  pending: number;
  cancelled: number;
}

export interface RoundsToTerminalStat {
  average: number | null;
  median: number | null;
  sampleSize: number;
}

export interface InterviewRoundAnalytics {
  byType: InterviewRoundTypeStat[];
  roundsToOffer: RoundsToTerminalStat;
  roundsToRejection: RoundsToTerminalStat;
}

interface Deps {
  applicationRepository: IApplicationRepository;
  interviewRoundRepository: IInterviewRoundRepository;
}

export interface GetInterviewRoundAnalyticsInput {
  userId: string;
}

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

function toStat(nums: number[]): RoundsToTerminalStat {
  return { average: average(nums), median: median(nums), sampleSize: nums.length };
}

/**
 * Complements GetDocumentVersionOutcomesUseCase (JEF-58), which only
 * measures whether an application led to an interview at all. This answers
 * how those interviews actually went: pass/fail counts per InterviewRound
 * type, and how many rounds an application typically goes through before
 * reaching an offer vs. a rejection.
 *
 * `withdrawn` applications are excluded from the rounds-to-terminal-state
 * metrics — they represent neither a pass nor a fail, so their round count
 * doesn't belong in either bucket (same rationale JEF-58 uses to exclude
 * document types it doesn't recognize rather than guessing a bucket for
 * them).
 */
export class GetInterviewRoundAnalyticsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetInterviewRoundAnalyticsInput): Promise<InterviewRoundAnalytics> {
    const [applications, rounds] = await Promise.all([
      this.deps.applicationRepository.findAllByUserId(input.userId),
      this.deps.interviewRoundRepository.findAllByUserId(input.userId),
    ]);

    const byType = INTERVIEW_ROUND_TYPES.map((type) => {
      const forType = rounds.filter((r) => r.type === type);
      return {
        type,
        passed: forType.filter((r) => r.outcome === 'passed').length,
        failed: forType.filter((r) => r.outcome === 'failed').length,
        pending: forType.filter((r) => r.outcome === 'pending').length,
        cancelled: forType.filter((r) => r.outcome === 'cancelled').length,
      };
    }).filter((stat) => stat.passed + stat.failed + stat.pending + stat.cancelled > 0);

    const roundCountByApplicationId = new Map<string, number>();
    for (const round of rounds) {
      roundCountByApplicationId.set(
        round.applicationId,
        (roundCountByApplicationId.get(round.applicationId) ?? 0) + 1,
      );
    }

    const offerRoundCounts: number[] = [];
    const rejectionRoundCounts: number[] = [];
    for (const application of applications) {
      const count = roundCountByApplicationId.get(application.id);
      if (!count) continue;
      if (application.status === 'offered' || application.status === 'accepted') {
        offerRoundCounts.push(count);
      } else if (application.status === 'rejected') {
        rejectionRoundCounts.push(count);
      }
    }

    return {
      byType,
      roundsToOffer: toStat(offerRoundCounts),
      roundsToRejection: toStat(rejectionRoundCounts),
    };
  }
}
