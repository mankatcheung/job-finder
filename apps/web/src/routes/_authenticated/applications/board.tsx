import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';
import { boardApplicationsQueryOptions } from './-board-queries';

export const Route = createFileRoute('/_authenticated/applications/board')({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(boardApplicationsQueryOptions),
  component: lazyRouteComponent(() => import('./-board-page'), 'KanbanBoard'),
});
