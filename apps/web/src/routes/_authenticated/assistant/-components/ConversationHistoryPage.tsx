import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, MessageCircleIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { EmptyState } from '@job-finder/ui';
import {
  conversationsQueryOptions,
  deleteConversationWithUndo,
  timeAgo,
} from '#/routes/_authenticated/assistant/-shared';
import { LLM_PROVIDER_LABEL } from '#/routes/_authenticated/settings/-components/shared';

export function ConversationHistoryPage() {
  const qc = useQueryClient();
  const { data } = useQuery(conversationsQueryOptions);
  const conversations = data?.conversations ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:px-8 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link
            to="/assistant"
            aria-label="Back to assistant"
            className="p-2 -ml-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon size={18} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 min-w-0 truncate">
            Conversation history
          </h1>
        </div>
        <Link
          to="/assistant"
          aria-label="New conversation"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <PlusIcon size={14} />
          <span className="hidden sm:inline">New conversation</span>
        </Link>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          className="py-16"
          icon={<MessageCircleIcon size={28} />}
          message={<span className="text-sm">No conversations yet.</span>}
          action={
            <Link to="/assistant" className="text-sm text-blue-600 dark:text-blue-400 underline">
              Start one
            </Link>
          }
        />
      ) : (
        <ul className="space-y-1.5">
          {conversations.map((c) => (
            <li key={c.id} className="relative">
              {/* Delete lives as a sibling, not nested inside the Link — a
                  button inside an anchor causes clicks to bubble into the
                  anchor's own navigation handler, which fired before the
                  delete when this was nested (clicking delete just opened
                  the conversation instead of removing it). */}
              <Link
                to="/assistant"
                search={{ conversation: c.id }}
                className="flex items-center justify-between gap-3 pl-4 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {c.title ?? 'New conversation'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {timeAgo(c.updatedAt)}
                    {c.llmProvider
                      ? ` · ${LLM_PROVIDER_LABEL[c.llmProvider] ?? c.llmProvider}`
                      : ''}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => deleteConversationWithUndo(qc, c.id)}
                aria-label={`Delete ${c.title ?? 'New conversation'}`}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <Trash2Icon size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
