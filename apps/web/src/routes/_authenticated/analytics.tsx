import { createFileRoute } from '@tanstack/react-router';
import { lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/analytics')({
  component: lazyRouteComponent(() => import('./-analytics-page'), 'AnalyticsPage'),
});
