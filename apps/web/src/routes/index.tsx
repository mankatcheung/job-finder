import { createFileRoute, redirect } from '@tanstack/react-router';
import { hydrateSession } from '#/graphql/client';

export const Route = createFileRoute('/')({
  // The API and web app are on separate domains, so there is no cookie the
  // server can ever see — the auth check can only run client-side. ssr:
  // false forces TanStack Start's hydrate() to call beforeLoad again on the
  // client instead of trusting an SSR-computed (and here undecidable) result.
  ssr: false,
  beforeLoad: async () => {
    const authed = await hydrateSession();
    throw redirect({ to: authed ? '/dashboard' : '/login' });
  },
  component: () => null,
});
