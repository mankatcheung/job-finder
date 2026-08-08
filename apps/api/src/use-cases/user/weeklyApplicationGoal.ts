import type { Application } from '#src/domain/application/Application.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getWeekStart(date: Date): Date {
  const start = new Date(date);
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function getWeeklyApplicationGoalStats(
  applications: Application[],
  goal: number,
  now = new Date(),
) {
  const currentWeekStart = getWeekStart(now);
  const counts = new Map<number, number>();

  for (const application of applications) {
    const week = getWeekStart(application.createdAt).getTime();
    counts.set(week, (counts.get(week) ?? 0) + 1);
  }

  const currentWeekCount = counts.get(currentWeekStart.getTime()) ?? 0;
  let streakWeeks = 0;
  let week = currentWeekStart.getTime();

  // An unfinished current week does not break the completed-week streak.
  if (currentWeekCount < goal) week -= WEEK_MS;
  while ((counts.get(week) ?? 0) >= goal) {
    streakWeeks++;
    week -= WEEK_MS;
  }

  return {
    weeklyApplicationGoal: goal,
    currentWeekCount,
    currentWeekStart: currentWeekStart.toISOString(),
    streakWeeks,
  };
}
