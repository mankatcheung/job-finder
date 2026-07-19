import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/applications/board')({
  component: lazyRouteComponent(
    () => import('./-board-page'),
    'KanbanBoard',
  ),
});
