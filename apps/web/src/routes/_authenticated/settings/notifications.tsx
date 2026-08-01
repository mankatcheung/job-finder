import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import {
  NOTIFICATION_PREFERENCES_QUERY,
  UPDATE_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from './-components/shared';

export const Route = createFileRoute('/_authenticated/settings/notifications')({
  component: SettingsNotificationsPage,
});

export function SettingsNotificationsPage() {
  const qc = useQueryClient();

  const { data: prefsData } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: () =>
      gqlClient.request<{ notificationPreferences: NotificationPreferences }>(
        NOTIFICATION_PREFERENCES_QUERY,
      ),
  });
  const prefs = prefsData?.notificationPreferences;

  const onToggleWeeklyDigest = async (checked: boolean) => {
    await gqlClient.request(UPDATE_NOTIFICATION_PREFERENCES, { weeklyDigestEnabled: checked });
    await qc.invalidateQueries({ queryKey: ['notificationPreferences'] });
  };

  const onToggleFollowUpReminders = async (checked: boolean) => {
    await gqlClient.request(UPDATE_NOTIFICATION_PREFERENCES, {
      followUpRemindersEnabled: checked,
    });
    await qc.invalidateQueries({ queryKey: ['notificationPreferences'] });
  };

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Notification preferences
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose which emails you want to receive.
          </p>
        </div>
        {prefs && (
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm text-gray-900 dark:text-gray-100">
              <input
                type="checkbox"
                checked={prefs.weeklyDigestEnabled}
                onChange={(e) => onToggleWeeklyDigest(e.target.checked)}
                className="h-4 w-4"
              />
              Weekly job search digest
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-900 dark:text-gray-100">
              <input
                type="checkbox"
                checked={prefs.followUpRemindersEnabled}
                onChange={(e) => onToggleFollowUpReminders(e.target.checked)}
                className="h-4 w-4"
              />
              Follow-up reminder emails
            </label>
          </div>
        )}
      </section>
    </div>
  );
}
