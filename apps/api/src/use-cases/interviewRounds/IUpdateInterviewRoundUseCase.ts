import type {
  InterviewRound,
  InterviewRoundType,
  InterviewRoundOutcome,
} from '#src/domain/interviewRound/InterviewRound.js';

export interface UpdateInterviewRoundInput {
  userId: string;
  roundId: string;
  type?: InterviewRoundType;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  interviewerName?: string | null;
  notes?: string | null;
  outcome?: InterviewRoundOutcome;
}

export type UpdateInterviewRoundOutput = InterviewRound;

export interface IUpdateInterviewRoundUseCase {
  execute(input: UpdateInterviewRoundInput): Promise<UpdateInterviewRoundOutput>;
}
