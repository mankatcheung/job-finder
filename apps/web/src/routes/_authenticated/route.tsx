import { createFileRoute, redirect } from '@tanstack/react-router';
import { hasSessionCookie } from '#/graphql/client';
import { AuthenticatedLayout } from './-components/AuthenticatedLayout';

export const Route = createFileRoute('/_authenticated')({
  // See routes/index.tsx for why this must be ssr: false.
  ssr: false,
  beforeLoad: ({ location }) => {
    if (!hasSessionCookie()) {
      // Remember the page the user asked for so login can send them straight
      // back to it (JEF-233); LoginPage falls back to /dashboard when the
      // parameter is absent or unsafe.
      throw redirect({ to: '/login', search: { returnTo: location.href } });
    }
  },
  component: AuthenticatedLayout,
});
