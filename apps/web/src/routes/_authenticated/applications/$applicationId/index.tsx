import { createFileRoute } from '@tanstack/react-router';
import { applicationQueryOptions } from './-application-query';
import { lazy } from 'react';

const ApplicationDetailPage = lazy(() =>
  import('./-components/ApplicationDetailPage').then((m) => ({ default: m.ApplicationDetailPage })),
);

export const Route = createFileRoute('/_authenticated/applications/$applicationId/')({
  loader: ({ context: { queryClient }, params: { applicationId } }) =>
    queryClient.ensureQueryData(applicationQueryOptions(applicationId)),
  component: ApplicationDetailPage,
});
