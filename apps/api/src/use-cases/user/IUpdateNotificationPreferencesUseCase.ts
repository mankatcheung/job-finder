export interface UpdateNotificationPreferencesInput {
  userId: string;
  weeklyDigestEnabled?: boolean;
  followUpRemindersEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
}

export interface IUpdateNotificationPreferencesUseCase {
  execute(input: UpdateNotificationPreferencesInput): Promise<void>;
}
