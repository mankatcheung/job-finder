// Hand-written to match apps/web's apps/web/src/routes/_authenticated/dashboard.tsx.
// Distinct query name/cache key from the (upcoming) calendar feature's own
// calendar-events query — same-shaped data, different query — so this
// screen's cache can't serve the calendar page's (or vice versa) stale
// result instead of fetching fresh data.

export const DASHBOARD_CALENDAR_EVENTS_QUERY = `
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

export const WEEKLY_APPLICATION_GOAL_QUERY = `
  query WeeklyApplicationGoal {
    weeklyApplicationGoal {
      weeklyApplicationGoal
      currentWeekCount
      currentWeekStart
      streakWeeks
    }
  }
`;
