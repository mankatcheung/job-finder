import { createFileRoute } from '@tanstack/react-router';
import { applicationQueryOptions } from './-application-query';
import { lazy } from 'react';

const EditApplicationPage = lazy(() =>
  import('./-components/EditApplicationPage').then((m) => ({ default: m.EditApplicationPage })),
);

export const Route = createFileRoute('/_authenticated/applications/$applicationId/edit')({
  loader: ({ context: { queryClient }, params: { applicationId } }) =>
    queryClient.ensureQueryData(applicationQueryOptions(applicationId)),
  component: EditApplicationPage,
});
