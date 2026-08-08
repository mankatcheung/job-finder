import { createFileRoute } from '@tanstack/react-router';

const SettingsNotificationsPage = () =>
  import('./-components/SettingsNotificationsPage').then((m) => m.SettingsNotificationsPage);

export const Route = createFileRoute('/_authenticated/settings/notifications')({
  component: SettingsNotificationsPage,
});
