export interface NotificationPreferences {
  weeklyDigestEnabled: boolean;
  digestFrequency: 'daily' | 'weekly' | 'off';
  followUpRemindersEnabled: boolean;
  pushNotificationsEnabled: boolean;
}

export interface IGetNotificationPreferencesUseCase {
  execute(userId: string): Promise<NotificationPreferences>;
}
