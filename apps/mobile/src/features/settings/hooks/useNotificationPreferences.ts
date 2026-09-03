import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import {
  NOTIFICATION_PREFERENCES_QUERY,
  UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
} from '../graphql/operations';
import type { DigestFrequency, NotificationPreferences } from '../types';

export const notificationPreferencesQueryKey = ['notificationPreferences'] as const;

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationPreferencesQueryKey,
    queryFn: () =>
      gqlRequest<{ notificationPreferences: NotificationPreferences }>(
        NOTIFICATION_PREFERENCES_QUERY,
      ).then((data) => data.notificationPreferences),
  });
}

export interface UpdateNotificationPreferencesInput {
  digestFrequency?: DigestFrequency;
  followUpRemindersEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  weeklyApplicationGoal?: number;
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateNotificationPreferencesInput) =>
      gqlRequest<{ updateNotificationPreferences: boolean }>(
        UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
        input,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationPreferencesQueryKey }),
  });
}
