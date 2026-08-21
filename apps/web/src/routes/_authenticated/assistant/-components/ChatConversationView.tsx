import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { gqlClient } from '#/graphql/client';
import { getGqlErrorCode, AI_NOT_CONFIGURED_CODE } from '#/lib/graphqlError';
import { getErrorMessage } from '#/lib/errors';
import { useLocale } from '#/lib/i18n';
import { Button, Input, Skeleton, Spinner } from '@trakwyn/ui';
import {
  CREATE_CONVERSATION,
  SEND_CHAT_MESSAGE,
  chatHistoryQueryOptions,
  conversationsQueryOptions,
  type ChatHistoryResult,
  type ChatMessage,
  type Conversation,
  type ConversationsResult,
} from '#/routes/_authenticated/assistant/-shared';

const LOADING_MESSAGE_INTERVAL_MS = 3000;
const LOADING_MESSAGE_COUNT = 4;

function tempMessageId(): string {
  return `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface ChatConversationViewProps {
  /** null means no conversation has been created yet — the first send lazily creates one. */
  conversationId: string | null;
  /** Provider/model to create the conversation with, if `conversationId` is null. Picking UI lives in the caller. */
  provider: string | null;
  model: string;
  /** Called once a conversation is lazily created on first send, so the caller can navigate/pin/etc. */
  onConversationCreated: (id: string) => void;
  /** Shown as clickable chips in the empty state, before any messages exist. Omit for a tighter layout. */
  suggestedQuestions?: string[];
  /** Tightens padding/max-width/text-size for the floating dock widget vs. the full page. */
  compact?: boolean;
}

/**
 * The core message-list + composer shared by the full-page assistant and the
 * floating chat dock widget (JEF-133) — history fetching, optimistic send,
 * the "thinking…" loading state, and AI_NOT_CONFIGURED error handling all
 * live here so the two surfaces can't drift apart. Header chrome (title,
 * delete/new/history actions, minimize/maximize/close) and the
 * provider/model picker are caller-specific and stay outside this component.
 */
export function ChatConversationView({
  conversationId,
  provider,
  model,
  onConversationCreated,
  suggestedQuestions,
  compact = false,
}: ChatConversationViewProps) {
  const { t } = useLocale();
  const LOADING_MESSAGES = [
    t('chat.loadingThinking'),
    t('chat.loadingLookingApplications'),
    t('chat.loadingCheckingDetails'),
    t('chat.loadingAlmostThere'),
  ];
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    ...chatHistoryQueryOptions(conversationId ?? ''),
    enabled: !!conversationId,
  });
  const messages = useMemo(
    () => (conversationId ? (historyData?.chatHistory ?? []) : []),
    [conversationId, historyData],
  );

  const send = useMutation({
    mutationFn: (vars: { conversationId: string; message: string }) =>
      gqlClient.request<{ sendChatMessage: string }>(SEND_CHAT_MESSAGE, vars),
  });

  const createConversation = useMutation({
    mutationFn: (vars: { provider?: string | null; model?: string | null }) =>
      gqlClient.request<{ createConversation: Conversation }>(CREATE_CONVERSATION, vars),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, send.isPending]);

  useEffect(() => {
    if (!send.isPending) {
      setLoadingMessageIndex(0);
      return;
    }
    const id = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGE_COUNT);
    }, LOADING_MESSAGE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [send.isPending]);

  const appendOptimistic = (targetConversationId: string, message: ChatMessage) => {
    qc.setQueryData<ChatHistoryResult>(
      chatHistoryQueryOptions(targetConversationId).queryKey,
      (prev) => ({ chatHistory: [...(prev?.chatHistory ?? []), message] }),
    );
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    setInput('');

    let targetConversationId = conversationId;
    if (!targetConversationId) {
      const created = await createConversation.mutateAsync({
        provider,
        model: model.trim() || undefined,
      });
      targetConversationId = created.createConversation.id;
      qc.setQueryData<ConversationsResult>(conversationsQueryOptions.queryKey, (prev) => ({
        conversations: [created.createConversation, ...(prev?.conversations ?? [])],
      }));
      onConversationCreated(targetConversationId);
    }

    appendOptimistic(targetConversationId, {
      id: tempMessageId(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    });
    try {
      const data = await send.mutateAsync({
        conversationId: targetConversationId,
        message: trimmed,
      });
      appendOptimistic(targetConversationId, {
        id: tempMessageId(),
        role: 'assistant',
        content: data.sendChatMessage,
        createdAt: new Date().toISOString(),
      });
      // Refreshes the conversation's title (auto-derived server-side from
      // the first message) and ordering (most-recently-updated first).
      void qc.invalidateQueries({ queryKey: conversationsQueryOptions.queryKey });
    } catch {
      // Error surfaced below via send.isError — the user's message stays visible so they can retry.
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSend(input);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        className={`flex-1 overflow-y-auto space-y-3 min-h-0 ${compact ? 'p-3' : 'space-y-4 mb-4'}`}
      >
        {conversationId && isHistoryLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('chat.emptyPrompt')}</p>
                {suggestedQuestions && suggestedQuestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => void handleSend(q)}
                        className="text-xs px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </>
        )}

        {send.isPending && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-400 flex items-center gap-2">
              <Spinner />
              {LOADING_MESSAGES[loadingMessageIndex]}
            </div>
          </div>
        )}

        {send.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {getGqlErrorCode(send.error) === AI_NOT_CONFIGURED_CODE ? (
              <>
                {t('resumeMatch.addApiKeyPrefix')}{' '}
                <Link to="/settings/ai" className="underline">
                  {t('resumeMatch.accountSettingsLinkText')}
                </Link>{' '}
                {t('resumeMatch.addApiKeySuffix')}
              </>
            ) : (
              getErrorMessage(send.error)
            )}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className={`flex gap-2 shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 ${compact ? 'p-2' : 'py-3'}`}
      >
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat.inputPlaceholder')}
          className="flex-1"
        />
        <Button type="submit" disabled={send.isPending || !input.trim()}>
          {t('chat.send')}
        </Button>
      </form>
    </div>
  );
}
