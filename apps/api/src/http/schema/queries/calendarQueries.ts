import { GraphQLError } from 'graphql';
import { builder } from '#src/http/schema/builder.js';
import { CalendarEventRef } from '#src/http/schema/types/CalendarEventType.js';
import { ERROR_CODES } from '#src/use-cases/errors/errorCodes.js';

builder.queryField('calendarEvents', (t) =>
  t.field({
    type: [CalendarEventRef],
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError('Unauthorized', { extensions: { code: ERROR_CODES.UNAUTHORIZED } });
      const { getCalendarEventsUseCase } = ctx.diScope.cradle;
      const events = await getCalendarEventsUseCase.execute({ userId: ctx.user.sub });
      return events.map((e) => ({
        ...e,
        date: e.date.toISOString(),
        interviewRoundType: e.interviewRoundType ?? null,
      }));
    },
  }),
);
