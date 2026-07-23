export interface NotificationPreferences {
  weeklyDigestEnabled: boolean;
  followUpRemindersEnabled: boolean;
}

export interface IGetNotificationPreferencesUseCase {
  execute(userId: string): Promise<NotificationPreferences>;
}
