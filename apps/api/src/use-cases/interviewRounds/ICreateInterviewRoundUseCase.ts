import type { InterviewRound, InterviewRoundType, InterviewRoundOutcome } from '@/domain/interviewRound/InterviewRound.js';

export interface CreateInterviewRoundInput {
  userId: string;
  applicationId: string;
  type?: InterviewRoundType;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  interviewerName?: string | null;
  notes?: string | null;
  outcome?: InterviewRoundOutcome;
}

export type CreateInterviewRoundOutput = InterviewRound;

export interface ICreateInterviewRoundUseCase {
  execute(input: CreateInterviewRoundInput): Promise<CreateInterviewRoundOutput>;
}
