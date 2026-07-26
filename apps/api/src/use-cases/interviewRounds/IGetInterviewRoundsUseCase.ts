import type { InterviewRound } from '#src/domain/interviewRound/InterviewRound.js';

export interface GetInterviewRoundsInput {
  userId: string;
  applicationId: string;
}

export type GetInterviewRoundsOutput = InterviewRound[];

export interface IGetInterviewRoundsUseCase {
  execute(input: GetInterviewRoundsInput): Promise<GetInterviewRoundsOutput>;
}
