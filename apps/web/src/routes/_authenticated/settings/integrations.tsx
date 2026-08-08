import { createFileRoute } from '@tanstack/react-router';
import { SettingsIntegrationsPage } from './-components/SettingsIntegrationsPage';

export const Route = createFileRoute('/_authenticated/settings/integrations')({
  component: SettingsIntegrationsPage,
});
