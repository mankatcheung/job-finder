import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircleIcon, XIcon } from 'lucide-react';
import { useChatDock } from '#/lib/chatDock';
import { useLocale } from '#/lib/i18n';
import { conversationsQueryOptions } from '#/routes/_authenticated/assistant/-shared';
import { ChatDockConversationPicker } from './-chat-dock-picker';

/**
 * Persistent desktop-only footer (JEF-133) present on every authenticated
 * page — the launcher opens the conversation picker, and pinned/minimized
 * conversations show up as a rail of pills the user can reopen or close
 * without leaving the page they're on.
 */
export function ChatDockFooter() {
  const { t } = useLocale();
  const dock = useChatDock();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data } = useQuery(conversationsQueryOptions);
  const titleById = new Map((data?.conversations ?? []).map((c) => [c.id, c.title]));

  const togglePill = (id: string) => {
    if (dock.expanded === id) dock.minimize();
    else dock.openConversation(id);
  };

  return (
    <footer className="hidden lg:flex fixed bottom-0 left-60 right-0 z-40 h-12 items-center gap-2 px-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          aria-label={t('chatDock.chatWithAssistant')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <MessageCircleIcon size={16} />
          {t('chatDock.chatWithAssistant')}
        </button>

        {pickerOpen && (
          <>
            {/* Invisible click-outside catcher — the popover itself sits above it (z-50 vs z-40). */}
            <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
            <div className="absolute bottom-full left-0 mb-2 z-50">
              <ChatDockConversationPicker onSelect={() => setPickerOpen(false)} />
            </div>
          </>
        )}
      </div>

      {dock.sections.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto min-w-0">
          {dock.sections.map((id) => (
            <div
              key={id}
              onClick={() => togglePill(id)}
              className={`flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg text-sm cursor-pointer transition-colors shrink-0 ${
                dock.expanded === id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="max-w-[10rem] truncate">
                {titleById.get(id) ?? t('assistant.newConversation')}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dock.closeSection(id);
                }}
                aria-label={t('chatDock.closeConversationAria')}
                className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
              >
                <XIcon size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </footer>
  );
}
