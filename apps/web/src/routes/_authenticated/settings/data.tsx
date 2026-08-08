import { createFileRoute } from '@tanstack/react-router';

const SettingsDataPage = () =>
  import('./-components/SettingsDataPage').then((m) => m.SettingsDataPage);

export const Route = createFileRoute('/_authenticated/settings/data')({
  component: SettingsDataPage,
});
