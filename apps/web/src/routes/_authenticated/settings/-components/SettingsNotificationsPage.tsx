import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { toast } from 'sonner';
import {
  NOTIFICATION_PREFERENCES_QUERY,
  UPDATE_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from './shared';
import { usePushNotifications } from '#/hooks/usePushNotifications';

export function SettingsNotificationsPage() {
  const qc = useQueryClient();
  const push = usePushNotifications();

  const { data: prefsData } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: () =>
      gqlClient.request<{ notificationPreferences: NotificationPreferences }>(
        NOTIFICATION_PREFERENCES_QUERY,
      ),
  });
  const prefs = prefsData?.notificationPreferences;
  const digestFrequency = prefs?.digestFrequency ?? (prefs?.weeklyDigestEnabled ? 'weekly' : 'off');

  const onChangeDigestFrequency = async (
    digestFrequency: NotificationPreferences['digestFrequency'],
  ) => {
    await gqlClient.request(UPDATE_NOTIFICATION_PREFERENCES, { digestFrequency });
    await qc.invalidateQueries({ queryKey: ['notificationPreferences'] });
  };

  const onToggleFollowUpReminders = async (checked: boolean) => {
    await gqlClient.request(UPDATE_NOTIFICATION_PREFERENCES, {
      followUpRemindersEnabled: checked,
    });
    await qc.invalidateQueries({ queryKey: ['notificationPreferences'] });
  };

  const onTogglePushNotifications = async (checked: boolean) => {
    if (checked) {
      const success = await push.enable();
      if (!success) {
        toast.error(
          push.isPermissionDenied
            ? 'Notification permission was denied. Reset it in your browser settings.'
            : 'Could not enable push notifications. Check your browser settings.',
        );
        return;
      }
      toast.success('Push notifications enabled');
    } else {
      await push.disable();
      toast.success('Push notifications disabled');
    }
    await gqlClient.request(UPDATE_NOTIFICATION_PREFERENCES, {
      pushNotificationsEnabled: checked,
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
            <div>
              <label
                htmlFor="digest-frequency"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Job search digest
              </label>
              <select
                id="digest-frequency"
                value={digestFrequency}
                onChange={(e) =>
                  onChangeDigestFrequency(
                    e.target.value as NotificationPreferences['digestFrequency'],
                  )
                }
                className="mt-1 block w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="off">Off</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Daily summarizes the last 24 hours; weekly summarizes the last 7 days.
              </p>
            </div>
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

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Browser push notifications
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Get notified on your device about upcoming interviews and follow-ups, even when you are
            not on this page.
          </p>
        </div>
        {push.isSupported ? (
          <label className="flex items-center gap-3 text-sm text-gray-900 dark:text-gray-100">
            <input
              type="checkbox"
              checked={push.isPermissionGranted}
              disabled={push.isBusy || push.isPermissionDenied}
              onChange={(e) => onTogglePushNotifications(e.target.checked)}
              className="h-4 w-4"
            />
            {push.isPermissionDenied
              ? 'Push notifications blocked — reset in browser settings'
              : push.isBusy
                ? 'Setting up...'
                : 'Push notifications for interviews & follow-ups'}
          </label>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Push notifications are not supported in this browser.
          </p>
        )}
      </section>
    </div>
  );
}
