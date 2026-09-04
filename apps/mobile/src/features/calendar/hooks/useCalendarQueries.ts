import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import { CALENDAR_EVENTS_QUERY } from '../graphql/operations';
import type { CalendarEvent } from '../types';

export function useCalendarEvents() {
  return useQuery({
    queryKey: ['calendarEvents', 'page'],
    queryFn: () =>
      gqlRequest<{ calendarEvents: CalendarEvent[] }>(CALENDAR_EVENTS_QUERY).then(
        (data) => data.calendarEvents,
      ),
  });
}
