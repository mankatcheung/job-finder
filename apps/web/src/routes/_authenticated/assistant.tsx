import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { gqlClient } from '#/graphql/client';
import { getGqlErrorCode, AI_NOT_CONFIGURED_CODE } from '#/lib/graphqlError';
import { getErrorMessage } from '#/lib/errors';

const SEND_CHAT_MESSAGE = `
  mutation SendChatMessage($history: [ChatMessageInput!]!, $message: String!) {
    sendChatMessage(history: $history, message: $message)
  }
`;

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Which applications haven't I followed up on?",
  'Summarize my interviews this month',
  'What are my active applications?',
];

export const Route = createFileRoute('/_authenticated/assistant')({
  component: AssistantPage,
});

export function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = useMutation({
    mutationFn: (message: string) =>
      gqlClient.request<{ sendChatMessage: string }>(SEND_CHAT_MESSAGE, {
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        message,
      }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, send.isPending]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    try {
      const data = await send.mutateAsync(trimmed);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.sendChatMessage }]);
    } catch {
      // Error surfaced below via send.isError — the user's message stays visible so they can retry.
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSend(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen max-w-3xl mx-auto p-4 sm:p-8">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 shrink-0">
        Assistant
      </h1>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
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
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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

        {send.isPending && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-400 flex items-center gap-2">
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-gray-300 border-t-transparent rounded-full" />
              Thinking…
            </div>
          </div>
        )}

        {send.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {getGqlErrorCode(send.error) === AI_NOT_CONFIGURED_CODE ? (
              <>
                Add your AI API key in{' '}
                <Link to="/account" className="underline">
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
  );
}
