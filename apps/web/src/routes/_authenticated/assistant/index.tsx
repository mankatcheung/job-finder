import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import {
  conversationsQueryOptions,
  chatHistoryQueryOptions,
} from '#/routes/_authenticated/assistant/-shared';
import { AssistantPage } from './-components/AssistantPage';

const searchSchema = z.object({ conversation: z.string().optional() });

export const Route = createFileRoute('/_authenticated/assistant/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ conversation: search.conversation }),
  loader: async ({ context: { queryClient }, deps }) => {
    await queryClient.ensureQueryData(conversationsQueryOptions);
    if (deps.conversation) {
      await queryClient.ensureQueryData(chatHistoryQueryOptions(deps.conversation));
    }
  },
  component: AssistantPage,
});
