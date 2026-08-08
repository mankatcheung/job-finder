import { createFileRoute } from '@tanstack/react-router';
import { SettingsProfilePage } from './-components/SettingsProfilePage';

export const Route = createFileRoute('/_authenticated/settings/profile')({
  component: SettingsProfilePage,
});
