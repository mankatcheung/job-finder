import { createFileRoute } from '@tanstack/react-router';
import { queryOptions } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { DashboardPage } from './-components/DashboardPage';

const APPLICATIONS_QUERY = `
  query Applications {
    applications {
      id
      company
      role
      status
      starred
      followUpAt
      createdAt
    }
  }
`;

const CALENDAR_EVENTS_QUERY = `
  query DashboardCalendarEvents {
    calendarEvents {
      id
      applicationId
      company
      role
      type
      date
      interviewRoundType
    }
  }
`;

type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  starred: boolean;
  followUpAt?: string | null;
  createdAt: string;
};

type CalendarEventKind = 'applied' | 'followUp' | 'interview';

type CalendarEvent = {
  id: string;
  applicationId: string;
  company: string;
  role: string;
  type: CalendarEventKind;
  date: string;
  interviewRoundType: string | null;
};

export const applicationsQueryOptions = queryOptions({
  queryKey: ['applications'],
  queryFn: () => gqlClient.request<{ applications: Application[] }>(APPLICATIONS_QUERY),
});

export const calendarEventsQueryOptions = queryOptions({
  queryKey: ['calendarEvents'],
  queryFn: () => gqlClient.request<{ calendarEvents: CalendarEvent[] }>(CALENDAR_EVENTS_QUERY),
});

export type { Application, CalendarEventKind, CalendarEvent };

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(applicationsQueryOptions),
      queryClient.ensureQueryData(calendarEventsQueryOptions),
    ]),
  component: DashboardPage,
});
