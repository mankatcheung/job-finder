export interface UpdateNotificationPreferencesInput {
  userId: string;
  weeklyDigestEnabled?: boolean;
  followUpRemindersEnabled?: boolean;
}

export interface IUpdateNotificationPreferencesUseCase {
  execute(input: UpdateNotificationPreferencesInput): Promise<void>;
}
