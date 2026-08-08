import { createFileRoute, redirect } from '@tanstack/react-router';
import { hydrateSession } from '#/graphql/client';
import { AuthenticatedLayout } from './-components/AuthenticatedLayout';

export const Route = createFileRoute('/_authenticated')({
  // See routes/index.tsx for why this must be ssr: false.
  ssr: false,
  beforeLoad: async () => {
    const authed = await hydrateSession();
    if (!authed) throw redirect({ to: '/login' });
  },
  component: AuthenticatedLayout,
});
