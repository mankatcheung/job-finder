import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { gqlClient } from '#/graphql/client';
import {
  LLM_API_KEYS_QUERY,
  LLM_PROVIDER_LABEL,
  type LlmApiKey,
} from '#/routes/_authenticated/settings/-components/shared';
import {
  conversationsQueryOptions,
  deleteConversationWithUndo,
} from '#/routes/_authenticated/assistant/-shared';
import { ChatConversationView } from './ChatConversationView';
import { HistoryIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { IconButton } from '@trakwyn/ui';
import { Route } from '../index';

const SUGGESTED_QUESTIONS = [
  "Which applications haven't I followed up on?",
  'Summarize my interviews this month',
  'What are my active applications?',
];

export function AssistantPage() {
  const { conversation: activeId } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();

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
              <IconButton
                label="Delete conversation"
                icon={<Trash2Icon size={16} />}
                variant="danger"
                onClick={onDeleteActiveConversation}
              />
            )}
            <IconButton
              label="New conversation"
              icon={<PlusIcon size={16} />}
              onClick={onNewConversation}
            />
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

        <ChatConversationView
          conversationId={activeId ?? null}
          provider={pickedProvider}
          model={pickedModel}
          suggestedQuestions={SUGGESTED_QUESTIONS}
          onConversationCreated={(id) => void navigate({ search: { conversation: id } })}
        />
      </div>
    </div>
  );
}
