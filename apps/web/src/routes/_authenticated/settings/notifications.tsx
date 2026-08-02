import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { toast } from 'sonner';
import {
  NOTIFICATION_PREFERENCES_QUERY,
  UPDATE_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from './-components/shared';
import { usePushNotifications } from '#/hooks/usePushNotifications';

export const Route = createFileRoute('/_authenticated/settings/notifications')({
  component: SettingsNotificationsPage,
});

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

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Browser push notifications
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Get notified on your device about upcoming interviews and follow-ups, even when you're
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
