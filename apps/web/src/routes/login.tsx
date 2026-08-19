import { createFileRoute, redirect } from '@tanstack/react-router';
import { hasSessionCookie } from '#/graphql/client';
import { z } from 'zod';
import { LoginPage } from './-components/LoginPage';

const searchSchema = z.object({
  oauthError: z.string().optional(),
  returnTo: z.string().optional(),
});

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  // See routes/index.tsx for why this must be ssr: false.
  ssr: false,
  beforeLoad: () => {
    if (hasSessionCookie()) throw redirect({ to: '/dashboard' });
  },
  component: LoginPage,
});
