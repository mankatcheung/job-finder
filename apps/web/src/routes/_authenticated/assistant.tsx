import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { gqlClient } from '#/graphql/client';
import { getGqlErrorCode, AI_NOT_CONFIGURED_CODE } from '#/lib/graphqlError';
import { getErrorMessage } from '#/lib/errors';
import { PlusIcon, Trash2Icon } from 'lucide-react';

const CONVERSATIONS_QUERY = `
  query Conversations {
    conversations {
      id
      title
      createdAt
      updatedAt
    }
  }
`;

const CHAT_HISTORY_QUERY = `
  query ChatHistory($conversationId: ID!) {
    chatHistory(conversationId: $conversationId) {
      role
      content
    }
  }
`;

const CREATE_CONVERSATION = `
  mutation CreateConversation {
    createConversation {
      id
      title
      createdAt
      updatedAt
    }
  }
`;

const SEND_CHAT_MESSAGE = `
  mutation SendChatMessage($conversationId: ID!, $message: String!) {
    sendChatMessage(conversationId: $conversationId, message: $message)
  }
`;

const DELETE_CONVERSATION = `
  mutation DeleteConversation($id: ID!) {
    deleteConversation(id: $id)
  }
`;

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatHistoryResult {
  chatHistory: ChatMessage[];
}

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationsResult {
  conversations: Conversation[];
}

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

const conversationsQueryOptions = queryOptions({
  queryKey: ['conversations'],
  queryFn: () => gqlClient.request<ConversationsResult>(CONVERSATIONS_QUERY),
});

function chatHistoryQueryOptions(conversationId: string) {
  return queryOptions({
    queryKey: ['chatHistory', conversationId],
    queryFn: () => gqlClient.request<ChatHistoryResult>(CHAT_HISTORY_QUERY, { conversationId }),
  });
}

const searchSchema = z.object({ conversation: z.string().optional() });

export const Route = createFileRoute('/_authenticated/assistant')({
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

export function AssistantPage() {
  const { conversation: activeId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();
  const [input, setInput] = useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData } = useQuery(conversationsQueryOptions);
  const conversations = conversationsData?.conversations ?? [];

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
    mutationFn: () => gqlClient.request<{ createConversation: Conversation }>(CREATE_CONVERSATION),
  });

  const deleteConversation = useMutation({
    mutationFn: (id: string) => gqlClient.request(DELETE_CONVERSATION, { id }),
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
      const created = await createConversation.mutateAsync();
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
      // Refreshes the sidebar's title (auto-derived server-side from the
      // first message) and ordering (most-recently-updated first).
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
    void navigate({ search: {} });
  };

  const onDeleteConversation = (id: string) => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    deleteConversation.mutate(id, {
      onSuccess: () => {
        qc.setQueryData<ConversationsResult>(conversationsQueryOptions.queryKey, (prev) => ({
          conversations: (prev?.conversations ?? []).filter((c) => c.id !== id),
        }));
        qc.removeQueries({ queryKey: chatHistoryQueryOptions(id).queryKey });
        if (activeId === id) void navigate({ search: {} });
      },
    });
  };

  return (
    <div className="flex flex-col sm:flex-row h-[calc(100vh-3.5rem)] lg:h-screen">
      <aside
        aria-label="Conversations"
        className="sm:w-56 shrink-0 max-h-40 sm:max-h-none overflow-y-auto border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 p-3 sm:p-4 space-y-1"
      >
        <button
          type="button"
          onClick={onNewConversation}
          className="w-full flex items-center gap-1.5 px-2 py-1.5 mb-2 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <PlusIcon size={14} />
          New conversation
        </button>
        {conversations.map((c) => (
          <Link
            key={c.id}
            to="/assistant"
            search={{ conversation: c.id }}
            className={`group flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors ${
              c.id === activeId
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="truncate">{c.title ?? 'New conversation'}</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onDeleteConversation(c.id);
              }}
              aria-label="Delete conversation"
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 dark:hover:text-red-400 shrink-0 transition-opacity"
            >
              <Trash2Icon size={12} />
            </button>
          </Link>
        ))}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 p-4 sm:p-8 max-w-3xl mx-auto w-full">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 shrink-0">
          Assistant
        </h1>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
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

        <form onSubmit={onSubmit} className="flex gap-2 shrink-0">
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
