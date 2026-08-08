import { createFileRoute } from '@tanstack/react-router';
import { SettingsNotificationsPage } from './-components/SettingsNotificationsPage';

export const Route = createFileRoute('/_authenticated/settings/notifications')({
  component: SettingsNotificationsPage,
});
