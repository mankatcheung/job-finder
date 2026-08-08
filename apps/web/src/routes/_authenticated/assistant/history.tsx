import { createFileRoute } from '@tanstack/react-router';
import { conversationsQueryOptions } from '#/routes/_authenticated/assistant/-shared';
import { lazy } from 'react';

const ConversationHistoryPage = lazy(() =>
  import('./-components/ConversationHistoryPage').then((m) => ({
    default: m.ConversationHistoryPage,
  })),
);

export const Route = createFileRoute('/_authenticated/assistant/history')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(conversationsQueryOptions);
  },
  component: ConversationHistoryPage,
});
