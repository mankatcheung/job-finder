export interface WeeklyApplicationGoalStats {
  weeklyApplicationGoal: number;
  currentWeekCount: number;
  currentWeekStart: string;
  streakWeeks: number;
}

export interface IGetWeeklyApplicationGoalUseCase {
  execute(userId: string): Promise<WeeklyApplicationGoalStats>;
}
