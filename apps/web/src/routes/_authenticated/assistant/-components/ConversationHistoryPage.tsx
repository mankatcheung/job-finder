import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, MessageCircleIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useLocale } from '#/lib/i18n';
import { EmptyState, Skeleton } from '@trakwyn/ui';
import {
  conversationsQueryOptions,
  deleteConversationWithUndo,
  timeAgo,
} from '#/routes/_authenticated/assistant/-shared';
import { LLM_PROVIDER_LABEL } from '#/routes/_authenticated/settings/-components/shared';

export function ConversationHistoryPage() {
  const { t } = useLocale();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(conversationsQueryOptions);
  const conversations = data?.conversations ?? [];

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/assistant"
            aria-label={t('conversationHistory.backAria')}
            className="-ml-2 rounded-lg p-2 text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeftIcon size={18} />
          </Link>
          <h1 className="min-w-0 truncate text-xl font-bold text-gray-900 dark:text-gray-100">
            {t('assistant.conversationHistory')}
          </h1>
        </div>
        <Link
          to="/assistant"
          aria-label={t('assistant.newConversation')}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          <PlusIcon size={14} />
          <span className="hidden sm:inline">{t('assistant.newConversation')}</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-1.5">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          className="py-16"
          icon={<MessageCircleIcon size={28} />}
          message={<span className="text-sm">{t('conversationHistory.noConversationsYet')}</span>}
          action={
            <Link to="/assistant" className="text-sm text-blue-600 underline dark:text-blue-400">
              {t('conversationHistory.startOne')}
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
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white py-3 pr-12 pl-4 transition-colors hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {c.title ?? t('assistant.newConversation')}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {timeAgo(c.updatedAt, t)}
                    {c.llmProvider
                      ? ` · ${LLM_PROVIDER_LABEL[c.llmProvider] ?? c.llmProvider}`
                      : ''}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => deleteConversationWithUndo(qc, c.id)}
                aria-label={t('conversationHistory.deleteAria', {
                  title: c.title ?? t('assistant.newConversation'),
                })}
                className="absolute top-1/2 right-3 -translate-y-1/2 p-1.5 text-gray-400 transition-colors hover:text-red-600 dark:hover:text-red-400"
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
