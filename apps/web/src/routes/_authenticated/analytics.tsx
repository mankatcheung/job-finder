import { createFileRoute } from '@tanstack/react-router';
import { lazyRouteComponent } from '@tanstack/react-router';
import { analyticsQueryOptions } from './-analytics-queries';

export const Route = createFileRoute('/_authenticated/analytics')({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(analyticsQueryOptions),
  component: lazyRouteComponent(() => import('./-analytics-page'), 'AnalyticsPage'),
});
