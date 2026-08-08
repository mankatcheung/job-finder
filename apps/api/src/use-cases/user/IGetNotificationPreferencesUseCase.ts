export interface NotificationPreferences {
  weeklyDigestEnabled: boolean;
  followUpRemindersEnabled: boolean;
  pushNotificationsEnabled: boolean;
  weeklyApplicationGoal: number;
}

export interface IGetNotificationPreferencesUseCase {
  execute(userId: string): Promise<NotificationPreferences>;
}
