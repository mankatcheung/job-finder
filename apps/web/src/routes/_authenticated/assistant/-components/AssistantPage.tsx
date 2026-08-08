import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { gqlClient } from '#/graphql/client';
import { getGqlErrorCode, AI_NOT_CONFIGURED_CODE } from '#/lib/graphqlError';
import { getErrorMessage } from '#/lib/errors';
import {
  LLM_API_KEYS_QUERY,
  LLM_PROVIDER_LABEL,
  type LlmApiKey,
} from '#/routes/_authenticated/settings/-components/shared';
import {
  CREATE_CONVERSATION,
  SEND_CHAT_MESSAGE,
  chatHistoryQueryOptions,
  conversationsQueryOptions,
  deleteConversationWithUndo,
  type ChatHistoryResult,
  type ChatMessage,
  type Conversation,
  type ConversationsResult,
} from '#/routes/_authenticated/assistant/-shared';
import { HistoryIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Route } from '../index';

const SUGGESTED_QUESTIONS = [
  "Which applications haven't I followed up on?",
  'Summarize my interviews this month',
  'What are my active applications?',
];

const LOADING_MESSAGES = [
  'Thinking…',
  'Looking into your applications…',
  'Checking the details…',
  'Almost there…',
];

const LOADING_MESSAGE_INTERVAL_MS = 3000;

export function AssistantPage() {
  const { conversation: activeId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData } = useQuery(conversationsQueryOptions);
  const conversations = conversationsData?.conversations ?? [];
  const activeConversation = conversations.find((c) => c.id === activeId);

  const { data: llmData } = useQuery({
    queryKey: ['llmApiKeys'],
    queryFn: () =>
      gqlClient.request<{ llmApiKeys: LlmApiKey[]; me: { defaultLlmProvider: string | null } }>(
        LLM_API_KEYS_QUERY,
      ),
  });
  const llmApiKeys = llmData?.llmApiKeys ?? [];
  const [pickedProvider, setPickedProvider] = useState<string | null>(null);
  const [pickedModel, setPickedModel] = useState('');
  useEffect(() => {
    if (pickedProvider === null && llmData) {
      setPickedProvider(
        llmData.me?.defaultLlmProvider ?? llmData.llmApiKeys?.[0]?.provider ?? null,
      );
    }
  }, [llmData, pickedProvider]);

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    ...chatHistoryQueryOptions(activeId ?? ''),
    enabled: !!activeId,
  });
  const messages = useMemo(
    () => (activeId ? (historyData?.chatHistory ?? []) : []),
    [activeId, historyData],
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
      setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, LOADING_MESSAGE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [send.isPending]);

  const appendOptimistic = (conversationId: string, message: ChatMessage) => {
    qc.setQueryData<ChatHistoryResult>(
      chatHistoryQueryOptions(conversationId).queryKey,
      (prev) => ({ chatHistory: [...(prev?.chatHistory ?? []), message] }),
    );
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    setInput('');

    let conversationId = activeId;
    if (!conversationId) {
      const created = await createConversation.mutateAsync({
        provider: pickedProvider,
        model: pickedModel.trim() || undefined,
      });
      conversationId = created.createConversation.id;
      qc.setQueryData<ConversationsResult>(conversationsQueryOptions.queryKey, (prev) => ({
        conversations: [created.createConversation, ...(prev?.conversations ?? [])],
      }));
      void navigate({ search: { conversation: conversationId } });
    }

    appendOptimistic(conversationId, { role: 'user', content: trimmed });
    try {
      const data = await send.mutateAsync({ conversationId, message: trimmed });
      appendOptimistic(conversationId, { role: 'assistant', content: data.sendChatMessage });
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

  const onNewConversation = () => {
    setPickedProvider(
      llmData?.me?.defaultLlmProvider ?? llmData?.llmApiKeys?.[0]?.provider ?? null,
    );
    setPickedModel('');
    void navigate({ search: {} });
  };

  const onDeleteActiveConversation = () => {
    if (!activeId) return;
    deleteConversationWithUndo(qc, activeId, () => void navigate({ search: {} }));
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-bottom))] sm:h-[calc(100dvh-3.5rem)] lg:h-screen">
      <div className="flex-1 flex flex-col min-w-0 px-4 pt-4 sm:px-8 sm:pt-8 max-w-3xl mx-auto w-full min-h-0">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Assistant</h1>
          <div className="flex items-center gap-1">
            {activeId && (
              <button
                type="button"
                onClick={onDeleteActiveConversation}
                aria-label="Delete conversation"
                title="Delete conversation"
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
              >
                <Trash2Icon size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onNewConversation}
              aria-label="New conversation"
              title="New conversation"
              className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg transition-colors"
            >
              <PlusIcon size={16} />
            </button>
            <Link
              to="/assistant/history"
              aria-label="Conversation history"
              title="Conversation history"
              className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg transition-colors"
            >
              <HistoryIcon size={16} />
            </Link>
          </div>
        </div>

        <div className="mb-4 shrink-0">
          {activeId && activeConversation?.llmProvider ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Using{' '}
              {LLM_PROVIDER_LABEL[activeConversation.llmProvider] ?? activeConversation.llmProvider}
              {activeConversation.llmModel ? ` (${activeConversation.llmModel})` : ''}
            </p>
          ) : !activeId && llmApiKeys.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Provider</label>
              <select
                value={pickedProvider ?? ''}
                onChange={(e) => setPickedProvider(e.target.value)}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {llmApiKeys.map((k) => (
                  <option key={k.provider} value={k.provider}>
                    {LLM_PROVIDER_LABEL[k.provider] ?? k.provider}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={pickedModel}
                onChange={(e) => setPickedModel(e.target.value)}
                placeholder="Model (optional)"
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 w-40"
              />
            </div>
          ) : !activeId ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Add an AI API key in{' '}
              <Link to="/settings/integrations" className="underline">
                Settings
              </Link>{' '}
              to use the assistant.
            </p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
          {activeId && isHistoryLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ask about your applications, contacts, or interview rounds.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q) => (
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
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
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
                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-gray-300 border-t-transparent rounded-full" />
                {LOADING_MESSAGES[loadingMessageIndex]}
              </div>
            </div>
          )}

          {send.isError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {getGqlErrorCode(send.error) === AI_NOT_CONFIGURED_CODE ? (
                <>
                  Add your AI API key in{' '}
                  <Link to="/settings/profile" className="underline">
                    Account settings
                  </Link>{' '}
                  to use this feature.
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
          className="flex gap-2 shrink-0 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={send.isPending || !input.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
