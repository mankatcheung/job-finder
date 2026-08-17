import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useChatDock } from '#/lib/chatDock';
import { useLocale } from '#/lib/i18n';
import { conversationsQueryOptions, timeAgo } from '#/routes/_authenticated/assistant/-shared';
import { LLM_PROVIDER_LABEL } from '#/routes/_authenticated/settings/-components/shared';

const RECENT_LIMIT = 6;

/**
 * The chat dock launcher's popover — "New conversation" plus a short list of
 * recent conversations to reopen. Visual template borrowed from
 * ConversationHistoryPage's row styling, compacted for a footer popover.
 */
export function ChatDockConversationPicker({ onSelect }: { onSelect: () => void }) {
  const { t } = useLocale();
  const dock = useChatDock();
  const { data } = useQuery(conversationsQueryOptions);
  const conversations = (data?.conversations ?? []).slice(0, RECENT_LIMIT);

  return (
    <div className="w-72 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => {
          dock.openNew();
          onSelect();
        }}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-100 dark:border-gray-700"
      >
        <PlusIcon size={15} />
        {t('assistant.newConversation')}
      </button>

      {conversations.length === 0 ? (
        <p className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 text-center">
          {t('conversationHistory.noConversationsYet')}
        </p>
      ) : (
        <ul className="max-h-72 overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  dock.openConversation(c.id);
                  onSelect();
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {c.title ?? t('assistant.newConversation')}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {timeAgo(c.updatedAt, t)}
                  {c.llmProvider ? ` · ${LLM_PROVIDER_LABEL[c.llmProvider] ?? c.llmProvider}` : ''}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
