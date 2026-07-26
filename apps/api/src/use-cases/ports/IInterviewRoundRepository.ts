import type { InterviewRound } from '#src/domain/interviewRound/InterviewRound.js';
import type {
  InterviewRoundType,
  InterviewRoundOutcome,
} from '#src/domain/interviewRound/InterviewRound.js';

export interface CreateInterviewRoundData {
  id: string;
  applicationId: string;
  type: InterviewRoundType;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  interviewerName?: string | null;
  notes?: string | null;
  outcome?: InterviewRoundOutcome;
}

export interface UpdateInterviewRoundData {
  type?: InterviewRoundType;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  interviewerName?: string | null;
  notes?: string | null;
  outcome?: InterviewRoundOutcome;
}

export interface IInterviewRoundRepository {
  findAllByApplicationId(applicationId: string): Promise<InterviewRound[]>;
  findById(id: string): Promise<InterviewRound | null>;
  create(data: CreateInterviewRoundData): Promise<InterviewRound>;
  update(id: string, data: UpdateInterviewRoundData): Promise<InterviewRound>;
  delete(id: string): Promise<void>;
}
