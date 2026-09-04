// Hand-written to match apps/web's apps/web/src/routes/_authenticated/calendar.tsx.
// Distinct query name/cache key from the dashboard feature's own calendar
// events query (see ../../dashboard/graphql/operations.ts) — same-shaped
// data, different query — so this page's cache can't serve the dashboard
// widget's stale result instead of fetching fresh data.

export const CALENDAR_EVENTS_QUERY = `
  query CalendarEvents {
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
