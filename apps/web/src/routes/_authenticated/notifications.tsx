import { createFileRoute } from '@tanstack/react-router';
import { NotificationsPage } from './-components/NotificationsPage';

export const Route = createFileRoute('/_authenticated/notifications')({
  component: NotificationsPage,
});
