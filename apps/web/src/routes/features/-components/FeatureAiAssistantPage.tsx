import { Sparkles, Check } from 'lucide-react';
import { FeaturePageLayout } from '#/components/marketing/FeaturePageLayout';

function ChatMockup() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/5 overflow-hidden dark:border-gray-800 dark:bg-gray-800/50">
      <div className="border-b border-gray-200 px-5 py-3.5 text-base font-bold text-gray-900 dark:border-gray-800 dark:text-gray-100">
        Assistant
      </div>
      <div className="flex flex-col gap-3 p-5">
        <div className="max-w-[80%] self-end rounded-xl bg-blue-600 px-4 py-2 text-sm text-white">
          Which of my applications haven&rsquo;t heard back in 2 weeks?
        </div>
        <div className="max-w-[85%] self-start rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
          Two: <strong className="font-semibold">Northwind Labs</strong> (applied 16 days ago) and{' '}
          <strong className="font-semibold">Fernbridge</strong> (14 days). Want me to draft a
          follow-up for either?
        </div>
        <div className="max-w-[80%] self-end rounded-xl bg-blue-600 px-4 py-2 text-sm text-white">
          Yes, draft one for Fernbridge — keep it short.
        </div>
        <div className="max-w-[85%] self-start rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
          Here&rsquo;s a short follow-up referencing your interview with their design lead. Want me
          to save it as a note on the application?
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-400 dark:border-gray-600">
          Ask about any application&hellip;
        </div>
      </div>
    </div>
  );
}

export function FeatureAiAssistantPage() {
  return (
    <FeaturePageLayout
      eyebrowIcon={Sparkles}
      eyebrowLabel="AI assistant"
      title="An assistant that knows your job search"
      description="Ask it about any application, get help drafting a message, or just talk through your options — it has the context of your whole pipeline."
      heroVisual={<ChatMockup />}
      heroVisualMaxWidth="max-w-2xl"
      benefits={[
        {
          title: 'Grounded in your data',
          description:
            "It reads your applications, notes and interview history when you ask — not a generic chatbot with no idea what you're actually working on. Ask about one company or your whole pipeline.",
          visual: (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                What it can see
              </div>
              <div className="mt-3 flex flex-col gap-2.5">
                {[
                  'Applications & pipeline status',
                  'Notes, interviews & contacts',
                  'Response times & likely-ghosted flags',
                ].map((line) => (
                  <div
                    key={line}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                    {line}
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          title: 'Bring your own AI key',
          description:
            "Connect OpenAI, Anthropic, or any OpenAI-compatible endpoint. It's your key, so it's your usage and your cost — nothing routes through a shared account.",
          visual: (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800/50 flex flex-col gap-2">
              <div className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Anthropic — key connected
              </div>
              <div className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-400 dark:border-gray-700">
                OpenAI
              </div>
              <div className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-400 dark:border-gray-700">
                Custom (OpenAI-compatible)
              </div>
            </div>
          ),
        },
        {
          title: 'A history you can return to',
          description:
            "Every conversation is saved on its own, so a thread about salary negotiation doesn't get buried under one about resume edits. Pick up any of them right where you left off.",
          visual: (
            <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              <div className="rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Fernbridge follow-up
              </div>
              <div className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                Negotiating the Northwind offer
              </div>
              <div className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                Which roles am I most likely to hear back from?
              </div>
            </div>
          ),
        },
      ]}
      ctaHeadline="Talk through your search with the assistant"
    />
  );
}
