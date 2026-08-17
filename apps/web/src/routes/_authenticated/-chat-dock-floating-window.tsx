import { createPortal } from 'react-dom';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronDownIcon, Maximize2Icon, XIcon } from 'lucide-react';
import { gqlClient } from '#/graphql/client';
import { IconButton } from '@trakwyn/ui';
import { useChatDock } from '#/lib/chatDock';
import { useLocale } from '#/lib/i18n';
import { conversationsQueryOptions } from '#/routes/_authenticated/assistant/-shared';
import {
  LLM_API_KEYS_QUERY,
  type LlmApiKey,
} from '#/routes/_authenticated/settings/-components/shared';
import { ChatConversationView } from '#/routes/_authenticated/assistant/-components/ChatConversationView';

/**
 * The dock's one expanded floating chat window (JEF-133) — portaled to
 * document.body, same escape-the-sidebar-stacking-context pattern as
 * NotificationInboxPanel. Unlike that panel this isn't a modal: no backdrop,
 * no click-outside/Escape-to-close, since it's meant to sit alongside the
 * page the user is working on rather than block it.
 */
export function ChatDockFloatingWindow() {
  const { t } = useLocale();
  const dock = useChatDock();
  const navigate = useNavigate();

  const { data: conversationsData } = useQuery(conversationsQueryOptions);
  const { data: llmData } = useQuery({
    queryKey: ['llmApiKeys'],
    queryFn: () =>
      gqlClient.request<{ llmApiKeys: LlmApiKey[]; me: { defaultLlmProvider: string | null } }>(
        LLM_API_KEYS_QUERY,
      ),
  });
  const llmApiKeys = llmData?.llmApiKeys ?? [];
  const defaultProvider = llmData?.me?.defaultLlmProvider ?? llmApiKeys[0]?.provider ?? null;

  if (!dock.expanded) return null;

  const isNew = dock.expanded === 'new';
  const activeConversation = isNew
    ? undefined
    : conversationsData?.conversations.find((c) => c.id === dock.expanded);
  const title = isNew
    ? t('assistant.newConversation')
    : (activeConversation?.title ?? t('assistant.newConversation'));

  const onMaximize = () => {
    if (isNew) return;
    const conversationId = dock.expanded as string;
    void navigate({ to: '/assistant', search: { conversation: conversationId } });
    dock.closeExpanded();
  };

  return createPortal(
    <div className="hidden lg:flex fixed bottom-16 right-4 z-50 w-96 h-[32rem] flex-col bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate min-w-0">
          {title}
        </h2>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onMaximize}
            disabled={isNew}
            aria-label={t('chatDock.maximizeAria')}
            title={isNew ? t('chatDock.sendMessageFirst') : t('chatDock.openFullPage')}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
          >
            <Maximize2Icon size={14} />
          </button>
          <IconButton
            label={t('chatDock.minimizeAria')}
            icon={<ChevronDownIcon size={16} />}
            onClick={dock.minimize}
          />
          <IconButton
            label={t('common.close')}
            icon={<XIcon size={14} />}
            variant="danger"
            onClick={dock.closeExpanded}
          />
        </div>
      </div>

      {llmApiKeys.length === 0 ? (
        <p className="flex-1 flex items-center justify-center text-center text-xs text-gray-400 dark:text-gray-500 px-4">
          {t('assistant.addApiKeyPrefix')}{' '}
          <Link to="/settings/integrations" className="underline mx-1">
            {t('assistant.settingsLinkText')}
          </Link>{' '}
          {t('assistant.addApiKeySuffix')}
        </p>
      ) : (
        <ChatConversationView
          conversationId={isNew ? null : (dock.expanded as string)}
          provider={defaultProvider}
          model=""
          onConversationCreated={(id) => dock.promoteNewConversation(id)}
          compact
        />
      )}
    </div>,
    document.body,
  );
}
