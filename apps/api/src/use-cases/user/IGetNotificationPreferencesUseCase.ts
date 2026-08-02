export interface NotificationPreferences {
  weeklyDigestEnabled: boolean;
  followUpRemindersEnabled: boolean;
  pushNotificationsEnabled: boolean;
}

export interface IGetNotificationPreferencesUseCase {
  execute(userId: string): Promise<NotificationPreferences>;
}
