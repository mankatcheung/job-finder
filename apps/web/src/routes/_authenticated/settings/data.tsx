import { createFileRoute } from '@tanstack/react-router';
import { SettingsDataPage } from './-components/SettingsDataPage';

export const Route = createFileRoute('/_authenticated/settings/data')({
  component: SettingsDataPage,
});
