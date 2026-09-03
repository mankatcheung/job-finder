import { useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import {
  DASHBOARD_CALENDAR_EVENTS_QUERY,
  WEEKLY_APPLICATION_GOAL_QUERY,
} from '../graphql/operations';
import type { CalendarEvent, WeeklyApplicationGoal } from '../types';

export function useDashboardCalendarEvents() {
  return useQuery({
    queryKey: ['calendarEvents'],
    queryFn: () =>
      gqlRequest<{ calendarEvents: CalendarEvent[] }>(DASHBOARD_CALENDAR_EVENTS_QUERY).then(
        (data) => data.calendarEvents,
      ),
  });
}

export function useWeeklyApplicationGoal() {
  return useQuery({
    queryKey: ['weeklyApplicationGoal'],
    queryFn: () =>
      gqlRequest<{ weeklyApplicationGoal: WeeklyApplicationGoal }>(
        WEEKLY_APPLICATION_GOAL_QUERY,
      ).then((data) => data.weeklyApplicationGoal),
  });
}
