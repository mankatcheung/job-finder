import { builder } from '#src/http/schema/builder.js';
import { InterviewRoundTypeEnum } from '#src/http/schema/types/enums/InterviewRoundEnums.js';
import type {
  InterviewRoundAnalytics,
  InterviewRoundTypeStat,
  RoundsToTerminalStat,
} from '#src/use-cases/interviewRounds/GetInterviewRoundAnalyticsUseCase.js';

const InterviewRoundTypeStatRef =
  builder.objectRef<InterviewRoundTypeStat>('InterviewRoundTypeStat');
InterviewRoundTypeStatRef.implement({
  fields: (t) => ({
    type: t.expose('type', { type: InterviewRoundTypeEnum }),
    passed: t.exposeInt('passed'),
    failed: t.exposeInt('failed'),
    pending: t.exposeInt('pending'),
    cancelled: t.exposeInt('cancelled'),
  }),
});

const RoundsToTerminalStatRef = builder.objectRef<RoundsToTerminalStat>('RoundsToTerminalStat');
RoundsToTerminalStatRef.implement({
  fields: (t) => ({
    average: t.exposeFloat('average', { nullable: true }),
    median: t.exposeFloat('median', { nullable: true }),
    sampleSize: t.exposeInt('sampleSize'),
  }),
});

export const InterviewRoundAnalyticsRef =
  builder.objectRef<InterviewRoundAnalytics>('InterviewRoundAnalytics');
InterviewRoundAnalyticsRef.implement({
  fields: (t) => ({
    byType: t.expose('byType', { type: [InterviewRoundTypeStatRef] }),
    roundsToOffer: t.expose('roundsToOffer', { type: RoundsToTerminalStatRef }),
    roundsToRejection: t.expose('roundsToRejection', { type: RoundsToTerminalStatRef }),
  }),
});
