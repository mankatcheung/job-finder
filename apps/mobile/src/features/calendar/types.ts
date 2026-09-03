export type CalendarEventKind = 'applied' | 'followUp' | 'interview';

export interface CalendarEvent {
  id: string;
  applicationId: string;
  company: string;
  role: string;
  type: CalendarEventKind;
  date: string;
  interviewRoundType: string | null;
}

export type CalendarViewMode = 'month' | 'week' | 'day';
