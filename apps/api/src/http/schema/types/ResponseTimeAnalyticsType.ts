import { builder } from '#src/http/schema/builder.js';
import { ApplicationStatusEnum } from '#src/http/schema/types/enums/ApplicationStatusEnum.js';
import type {
  ResponseTimeAnalytics,
  StageDurationStat,
  TimeToResponseStat,
} from '#src/use-cases/activityLogs/GetResponseTimeAnalyticsUseCase.js';

const StageDurationStatRef = builder.objectRef<StageDurationStat>('StageDurationStat');
StageDurationStatRef.implement({
  fields: (t) => ({
    status: t.expose('status', { type: ApplicationStatusEnum }),
    averageDays: t.exposeFloat('averageDays', { nullable: true }),
    medianDays: t.exposeFloat('medianDays', { nullable: true }),
    sampleSize: t.exposeInt('sampleSize'),
  }),
});

const TimeToResponseStatRef = builder.objectRef<TimeToResponseStat>('TimeToResponseStat');
TimeToResponseStatRef.implement({
  fields: (t) => ({
    averageDays: t.exposeFloat('averageDays', { nullable: true }),
    medianDays: t.exposeFloat('medianDays', { nullable: true }),
    sampleSize: t.exposeInt('sampleSize'),
  }),
});

export const ResponseTimeAnalyticsRef =
  builder.objectRef<ResponseTimeAnalytics>('ResponseTimeAnalytics');
ResponseTimeAnalyticsRef.implement({
  fields: (t) => ({
    timeInStage: t.expose('timeInStage', { type: [StageDurationStatRef] }),
    timeToFirstResponse: t.expose('timeToFirstResponse', { type: TimeToResponseStatRef }),
  }),
});
