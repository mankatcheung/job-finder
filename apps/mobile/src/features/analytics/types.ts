import type { ApplicationStatus } from '../applications/types';

export interface AnalyticsApplication {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedAt?: string | null;
  createdAt: string;
  likelyGhosted: boolean;
}

export interface DocumentVersionOutcome {
  documentType: string;
  version: string | null;
  applicationCount: number;
  interviewCount: number;
  interviewRate: number;
}

export interface InterviewRoundTypeStat {
  type: string;
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

export interface OfferTrendPoint {
  offerId: string;
  applicationId: string;
  company: string;
  role: string;
  createdAt: string;
  currency: string;
  normalizedYearlySalary: number;
}

export interface CurrencyGroupStat {
  currency: string;
  count: number;
  minYearlySalary: number;
  maxYearlySalary: number;
  medianYearlySalary: number;
  averageYearlySalary: number;
}

export interface OfferAnalytics {
  trend: OfferTrendPoint[];
  byCurrency: CurrencyGroupStat[];
}

export interface ApplicationGroupStat {
  label: string;
  applicationCount: number;
  respondedCount: number;
  responseRate: number;
  offerCount: number;
  offerRate: number;
}

export interface ApplicationChannelAnalytics {
  bySource: ApplicationGroupStat[];
  byTag: ApplicationGroupStat[];
}

export interface StageDurationStat {
  status: string;
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
