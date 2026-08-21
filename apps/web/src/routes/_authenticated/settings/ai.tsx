import { createFileRoute } from '@tanstack/react-router';
import { SettingsAiPage } from './-components/SettingsAiPage';

export const Route = createFileRoute('/_authenticated/settings/ai')({
  component: SettingsAiPage,
});
