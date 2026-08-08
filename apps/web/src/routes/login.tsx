import { createFileRoute, redirect } from '@tanstack/react-router';
import { hydrateSession } from '#/graphql/client';
import { z } from 'zod';
import { LoginPage } from './-components/LoginPage';

const searchSchema = z.object({ oauthError: z.string().optional() });

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  // See routes/index.tsx for why this must be ssr: false.
  ssr: false,
  beforeLoad: async () => {
    const authed = await hydrateSession();
    if (authed) throw redirect({ to: '/dashboard' });
  },
  component: LoginPage,
});
