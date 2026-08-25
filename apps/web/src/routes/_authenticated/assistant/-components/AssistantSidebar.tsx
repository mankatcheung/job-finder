import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { MessageCircleIcon, PlusIcon } from 'lucide-react';
import { useLocale } from '#/lib/i18n';
import { Skeleton } from '@trakwyn/ui';
import {
  recentConversationsQueryOptions,
  timeAgo,
} from '#/routes/_authenticated/assistant/-shared';

export interface AssistantSidebarProps {
  /** Conversation currently open in the main pane, if any. */
  activeId?: string;
  onNewConversation: () => void;
}

/**
 * Desktop conversation rail for the assistant page (JEF-229): new chat up
 * top, the ten most recent threads in a scrollable list, and an all-chats
 * link at the bottom. Bounded to ten server-side so opening `/assistant`
 * never pulls the user's entire history just to render this list.
 *
 * Hidden below `lg` — small screens keep the header icon buttons and the
 * history page rather than a drawer, so the chat column keeps its width.
 */
export function AssistantSidebar({ activeId, onNewConversation }: AssistantSidebarProps) {
  const { t } = useLocale();
  const { data, isLoading } = useQuery(recentConversationsQueryOptions());
  const conversations = data?.conversations ?? [];

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-gray-50/60 lg:flex dark:border-gray-800 dark:bg-gray-900/40">
      <div className="p-3">
        <button
          type="button"
          onClick={onNewConversation}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-blue-700 dark:hover:text-blue-400"
        >
          <PlusIcon size={14} />
          {t('assistant.newConversation')}
        </button>
      </div>

      <nav
        aria-label={t('assistant.conversationHistory')}
        className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3"
      >
        {isLoading ? (
          <div className="space-y-1">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : (
          conversations.map((c) => {
            const isActive = c.id === activeId;
            return (
              <Link
                key={c.id}
                to="/assistant"
                search={{ conversation: c.id }}
                aria-current={isActive ? 'page' : undefined}
                className={`block rounded-lg px-3 py-2 transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <p
                  className={`truncate text-sm ${
                    isActive
                      ? 'font-semibold text-blue-700 dark:text-blue-400'
                      : 'font-medium text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {c.title ?? t('assistant.newConversation')}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {timeAgo(c.updatedAt, t)}
                </p>
              </Link>
            );
          })
        )}
      </nav>

      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        <Link
          to="/assistant/history"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          <MessageCircleIcon size={14} />
          {t('assistant.allChats')}
        </Link>
      </div>
    </aside>
  );
}
