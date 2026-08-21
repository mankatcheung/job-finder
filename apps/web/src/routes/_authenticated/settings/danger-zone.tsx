import { createFileRoute } from '@tanstack/react-router';
import { SettingsDangerZonePage } from './-components/SettingsDangerZonePage';

export const Route = createFileRoute('/_authenticated/settings/danger-zone')({
  component: SettingsDangerZonePage,
});
