import { Sparkles, Check } from 'lucide-react';
import { FeaturePageLayout } from '#/components/marketing/FeaturePageLayout';
import { useLocale } from '#/lib/i18n';

const SAMPLE_COMPANY_A = 'Northwind Labs';
const SAMPLE_COMPANY_B = 'Fernbridge';
const PROVIDER_OPENAI = 'OpenAI';

function ChatMockup() {
  const { t } = useLocale();
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-900/5 dark:border-gray-800 dark:bg-gray-800/50">
      <div className="border-b border-gray-200 px-5 py-3.5 text-base font-bold text-gray-900 dark:border-gray-800 dark:text-gray-100">
        {t('features.aiAssistant.panelTitle')}
      </div>
      <div className="flex flex-col gap-3 p-5">
        <div className="max-w-[80%] self-end rounded-xl bg-blue-600 px-4 py-2 text-sm text-white">
          {t('features.aiAssistant.bubbleQuestion1')}
        </div>
        <div className="max-w-[85%] self-start rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
          {t('features.aiAssistant.bubbleAnswer1Lead')}{' '}
          <strong className="font-semibold">{SAMPLE_COMPANY_A}</strong>{' '}
          {t('features.aiAssistant.bubbleAnswer1Mid')}{' '}
          <strong className="font-semibold">{SAMPLE_COMPANY_B}</strong>{' '}
          {t('features.aiAssistant.bubbleAnswer1Tail')}
        </div>
        <div className="max-w-[80%] self-end rounded-xl bg-blue-600 px-4 py-2 text-sm text-white">
          {t('features.aiAssistant.bubbleQuestion2')}
        </div>
        <div className="max-w-[85%] self-start rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-300">
          {t('features.aiAssistant.bubbleAnswer2')}
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-400 dark:border-gray-600">
          {t('features.aiAssistant.inputPlaceholder')}
        </div>
      </div>
    </div>
  );
}

export function FeatureAiAssistantPage() {
  const { t } = useLocale();
  return (
    <FeaturePageLayout
      eyebrowIcon={Sparkles}
      eyebrowLabel={t('features.aiAssistant.eyebrow')}
      title={t('features.aiAssistant.title')}
      description={t('features.aiAssistant.description')}
      heroVisual={<ChatMockup />}
      heroVisualMaxWidth="max-w-2xl"
      benefits={[
        {
          title: t('features.aiAssistant.benefit1.title'),
          description: t('features.aiAssistant.benefit1.description'),
          visual: (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {t('features.aiAssistant.canSeeLabel')}
              </div>
              <div className="mt-3 flex flex-col gap-2.5">
                {[
                  'features.aiAssistant.canSeeItem1',
                  'features.aiAssistant.canSeeItem2',
                  'features.aiAssistant.canSeeItem3',
                ].map((lineKey) => (
                  <div
                    key={lineKey}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <Check className="size-3.5 shrink-0 text-blue-600" />
                    {t(lineKey)}
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          title: t('features.aiAssistant.benefit2.title'),
          description: t('features.aiAssistant.benefit2.description'),
          visual: (
            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              <div className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {t('features.aiAssistant.keyConnected')}
              </div>
              <div className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-400 dark:border-gray-700">
                {PROVIDER_OPENAI}
              </div>
              <div className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-400 dark:border-gray-700">
                {t('features.aiAssistant.providerCustom')}
              </div>
            </div>
          ),
        },
        {
          title: t('features.aiAssistant.benefit3.title'),
          description: t('features.aiAssistant.benefit3.description'),
          visual: (
            <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
              <div className="rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {t('features.aiAssistant.historyItem1')}
              </div>
              <div className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                {t('features.aiAssistant.historyItem2')}
              </div>
              <div className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                {t('features.aiAssistant.historyItem3')}
              </div>
            </div>
          ),
        },
      ]}
      ctaHeadline={t('features.aiAssistant.ctaHeadline')}
    />
  );
}
