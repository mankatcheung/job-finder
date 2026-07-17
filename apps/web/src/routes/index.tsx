import { createFileRoute, redirect } from '@tanstack/react-router';
import { isAuthenticated } from '#/lib/auth';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return; // SSR: can't read localStorage, defer to client
    if (isAuthenticated()) {
      throw redirect({ to: '/dashboard' });
    }
    throw redirect({ to: '/login' });
  },
  component: () => null,
});
