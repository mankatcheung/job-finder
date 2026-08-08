export interface UpdateNotificationPreferencesInput {
  userId: string;
  weeklyDigestEnabled?: boolean;
  followUpRemindersEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  weeklyApplicationGoal?: number;
}

export interface IUpdateNotificationPreferencesUseCase {
  execute(input: UpdateNotificationPreferencesInput): Promise<void>;
}
