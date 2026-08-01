import { builder } from '#src/http/schema/builder.js';
import { CalendarEventTypeEnum } from '#src/http/schema/types/enums/CalendarEventTypeEnum.js';
import { InterviewRoundTypeEnum } from '#src/http/schema/types/enums/InterviewRoundEnums.js';
import type { CalendarEventType as CalendarEventKind } from '#src/use-cases/calendar/GetCalendarEventsUseCase.js';
import type { InterviewRoundType } from '#src/domain/interviewRound/InterviewRound.js';

export interface CalendarEventDTO {
  id: string;
  applicationId: string;
  company: string;
  role: string;
  type: CalendarEventKind;
  date: string;
  interviewRoundType: InterviewRoundType | null;
}

export const CalendarEventRef = builder.objectRef<CalendarEventDTO>('CalendarEvent');
CalendarEventRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    applicationId: t.exposeID('applicationId'),
    company: t.exposeString('company'),
    role: t.exposeString('role'),
    type: t.expose('type', { type: CalendarEventTypeEnum }),
    date: t.exposeString('date'),
    interviewRoundType: t.expose('interviewRoundType', {
      type: InterviewRoundTypeEnum,
      nullable: true,
    }),
  }),
});
