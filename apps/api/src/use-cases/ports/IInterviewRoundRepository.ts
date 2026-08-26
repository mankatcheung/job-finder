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
  countByApplicationId(applicationId: string): Promise<number>;
  /** Across every application owned by the user — for the calendar view. */
  findAllByUserId(userId: string): Promise<InterviewRound[]>;
  findById(id: string): Promise<InterviewRound | null>;
  /** Rounds scheduled within `windowMs` from now, not completed/cancelled. */
  findUpcomingWithinWindow(windowMs: number): Promise<InterviewRound[]>;
  create(data: CreateInterviewRoundData): Promise<InterviewRound>;
  update(id: string, data: UpdateInterviewRoundData): Promise<InterviewRound>;
  updatePushNotificationSentAt(id: string, sentAt: Date): Promise<void>;
  delete(id: string, applicationId: string): Promise<void>;
}
