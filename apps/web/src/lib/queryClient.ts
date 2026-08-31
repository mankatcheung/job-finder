import { QueryClient, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '#/lib/errors';

export const queryClient = new QueryClient({
  // Fires for every mutation that doesn't already handle its own error (in
  // addition to, not instead of, any mutation-level onError) — a safety net
  // so a mutation with no bespoke error handling (board drag-and-drop, bulk
  // actions, note/contact/interview-round CRUD, logout) still surfaces
  // something to the user instead of failing silently.
  mutationCache: new MutationCache({
    onError: (error) => toast.error(getErrorMessage(error)),
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});
