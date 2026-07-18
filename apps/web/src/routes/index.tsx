import { createFileRoute, redirect } from '@tanstack/react-router';
import { isAuthenticated, getIsAuthenticated } from '#/lib/auth';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const authed =
      typeof window !== 'undefined' ? isAuthenticated() : await getIsAuthenticated();
    throw redirect({ to: authed ? '/dashboard' : '/login' });
  },
  component: () => null,
});
