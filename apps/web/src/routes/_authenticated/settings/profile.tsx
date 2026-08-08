import { createFileRoute } from '@tanstack/react-router';

const SettingsProfilePage = () =>
  import('./-components/SettingsProfilePage').then((m) => m.SettingsProfilePage);

export const Route = createFileRoute('/_authenticated/settings/profile')({
  component: SettingsProfilePage,
});
