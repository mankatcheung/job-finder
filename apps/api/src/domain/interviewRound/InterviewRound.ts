export type InterviewRoundType = 'phone' | 'technical' | 'onsite' | 'hr' | 'other';
export type InterviewRoundOutcome = 'pending' | 'passed' | 'failed' | 'cancelled';

export interface InterviewRound {
  id: string;
  applicationId: string;
  type: InterviewRoundType;
  scheduledAt: Date | null;
  completedAt: Date | null;
  interviewerName: string | null;
  notes: string | null;
  outcome: InterviewRoundOutcome;
  createdAt: Date;
  updatedAt: Date;
}
