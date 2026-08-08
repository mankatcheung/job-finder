import { createFileRoute } from '@tanstack/react-router';
import { applicationQueryOptions } from './-application-query';
import { ApplicationDetailPage } from './-components/ApplicationDetailPage';

export const Route = createFileRoute('/_authenticated/applications/$applicationId/')({
  loader: ({ context: { queryClient }, params: { applicationId } }) =>
    queryClient.ensureQueryData(applicationQueryOptions(applicationId)),
  component: ApplicationDetailPage,
});
