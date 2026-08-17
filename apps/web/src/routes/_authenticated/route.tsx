import { createFileRoute, redirect } from '@tanstack/react-router';
import { hasSessionCookie } from '#/graphql/client';
import { AuthenticatedLayout } from './-components/AuthenticatedLayout';

export const Route = createFileRoute('/_authenticated')({
  // See routes/index.tsx for why this must be ssr: false.
  ssr: false,
  beforeLoad: () => {
    if (!hasSessionCookie()) throw redirect({ to: '/login' });
  },
  component: AuthenticatedLayout,
});
