import { createFileRoute } from '@tanstack/react-router';
import { SettingsSecurityPage } from './-components/SettingsSecurityPage';

export const Route = createFileRoute('/_authenticated/settings/security')({
  component: SettingsSecurityPage,
});
