import { createFileRoute } from '@tanstack/react-router';

const SettingsIntegrationsPage = () =>
  import('./-components/SettingsIntegrationsPage').then((m) => m.SettingsIntegrationsPage);

export const Route = createFileRoute('/_authenticated/settings/integrations')({
  component: SettingsIntegrationsPage,
});
