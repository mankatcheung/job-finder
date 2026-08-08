import { builder } from '#src/http/schema/builder.js';
import type { WeeklyApplicationGoalStats } from '#src/use-cases/user/IGetWeeklyApplicationGoalUseCase.js';

export const WeeklyApplicationGoalRef =
  builder.objectRef<WeeklyApplicationGoalStats>('WeeklyApplicationGoal');

WeeklyApplicationGoalRef.implement({
  fields: (t) => ({
    weeklyApplicationGoal: t.exposeInt('weeklyApplicationGoal'),
    currentWeekCount: t.exposeInt('currentWeekCount'),
    currentWeekStart: t.exposeString('currentWeekStart'),
    streakWeeks: t.exposeInt('streakWeeks'),
  }),
});
