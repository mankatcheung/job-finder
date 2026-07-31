import type { IApplicationRepository } from '#src/use-cases/ports/IApplicationRepository.js';
import type { IInterviewRoundRepository } from '#src/use-cases/ports/IInterviewRoundRepository.js';
import type { InterviewRoundType } from '#src/domain/interviewRound/InterviewRound.js';

export type CalendarEventType = 'applied' | 'followUp' | 'interview';

export interface CalendarEvent {
  id: string;
  applicationId: string;
  company: string;
  role: string;
  type: CalendarEventType;
  date: Date;
  interviewRoundType?: InterviewRoundType;
}

interface Deps {
  applicationRepository: IApplicationRepository;
  interviewRoundRepository: IInterviewRoundRepository;
}

export interface GetCalendarEventsInput {
  userId: string;
}

export class GetCalendarEventsUseCase {
  constructor(private readonly deps: Deps) {}

  async execute(input: GetCalendarEventsInput): Promise<CalendarEvent[]> {
    const [applications, interviewRounds] = await Promise.all([
      this.deps.applicationRepository.findAllByUserId(input.userId),
      this.deps.interviewRoundRepository.findAllByUserId(input.userId),
    ]);

    const applicationById = new Map(applications.map((a) => [a.id, a]));
    const events: CalendarEvent[] = [];

    for (const app of applications) {
      if (app.appliedAt) {
        events.push({
          id: `${app.id}-applied`,
          applicationId: app.id,
          company: app.company,
          role: app.role,
          type: 'applied',
          date: app.appliedAt,
        });
      }
      if (app.followUpAt) {
        events.push({
          id: `${app.id}-follow-up`,
          applicationId: app.id,
          company: app.company,
          role: app.role,
          type: 'followUp',
          date: app.followUpAt,
        });
      }
    }

    for (const round of interviewRounds) {
      if (!round.scheduledAt) continue;
      const app = applicationById.get(round.applicationId);
      if (!app) continue;
      events.push({
        id: round.id,
        applicationId: app.id,
        company: app.company,
        role: app.role,
        type: 'interview',
        date: round.scheduledAt,
        interviewRoundType: round.type,
      });
    }

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
