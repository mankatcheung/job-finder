import { createFileRoute, redirect } from '@tanstack/react-router';
import { hydrateSession } from '#/graphql/client';

const RegisterPage = () => import('./-components/RegisterPage').then((m) => m.RegisterPage);

export const Route = createFileRoute('/register')({
  // See routes/index.tsx for why this must be ssr: false.
  ssr: false,
  beforeLoad: async () => {
    const authed = await hydrateSession();
    if (authed) throw redirect({ to: '/dashboard' });
  },
  component: RegisterPage,
});
