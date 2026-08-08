import { createFileRoute } from '@tanstack/react-router';

const SettingsSecurityPage = () =>
  import('./-components/SettingsSecurityPage').then((m) => m.SettingsSecurityPage);

export const Route = createFileRoute('/_authenticated/settings/security')({
  component: SettingsSecurityPage,
});
